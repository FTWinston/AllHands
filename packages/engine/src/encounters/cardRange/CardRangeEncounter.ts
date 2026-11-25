import { cardRangeEncounterId, type CardRangePreset } from 'common-data/features/cards/types/CardRangeInfo';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { hostileToPlayer, playerFactionId } from '../../campaign/factions';
import { createShipSetup, type ShipDesign } from '../../campaign/shipDesigns';
import { AiShip } from '../../state/AiShip';
import { CardState } from '../../state/CardState';
import { getPlayerShips } from '../../utils/shipQueries';
import { Encounter } from '../Encounter';
import { getCardRangeDefinition } from './cardRangeCards';
import type { EncounterDefinition } from '../EncounterDefinition';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { AiPriorities } from 'common-data/features/space/types/GameObjectInfo';
import type { Position } from 'common-data/features/space/types/Position';
import type { GameObject } from 'src/state/GameObject';
import type { PlayerShip } from 'src/state/PlayerShip';
import type { SystemState } from 'src/state/systems/SystemState';
import type { RemovalReason } from 'src/types/RemovalReason';

/** The range's targets, which are hostile so that every card that needs an enemy can be played on them. */
const targetFaction = 'rangeTargets';
/** A friendly ship, for cards played on one. */
const allyFaction = 'rangeAllies';

/** How long after a target is destroyed it comes back, in game time. */
export const respawnDelayMs = 3000;

/** What a ship on the range does: nothing at all, only shoot back from where it is, or fight as usual. */
type Behaviour = 'passive' | 'shooting' | 'live';

const behaviourPriorities: Record<Behaviour, AiPriorities | undefined> = {
    passive: { helm: 0, tactical: 0, science: 0, engineer: 0 },
    shooting: { helm: 0, science: 0 },
    live: undefined,
};

/** How well a ship that fights as usual does it: badly, so it doesn't win before the card has been tried. */
const liveSkill = 0.3;

interface RangeShip {
    design: ShipDesign;
    name: string;
    faction: string;
    behaviour: Behaviour;
    position: Position;
}

/** The player ship starts at the origin, facing along x, so these are ahead of it: within range of most weapons, and in their arcs. */
function target(name: string, design: ShipDesign, x: number, y: number, behaviour: Behaviour = 'passive'): RangeShip {
    return { design, name, faction: targetFaction, behaviour, position: { x, y, angle: Math.atan2(-y, -x) } };
}

const passiveTargets: readonly RangeShip[] = [
    target('Target A', 'harrier', 7, 0),
    target('Target B', 'bulwark', 12, 3),
];

/** Who's on the range for each preset. */
const presetShips: Record<CardRangePreset, readonly RangeShip[]> = {
    targets: passiveTargets,
    armed: passiveTargets,
    damaged: passiveTargets,
    incoming: [
        target('Gunner A', 'harrier', 9, -2, 'shooting'),
        target('Gunner B', 'harrier', 11, 3, 'shooting'),
    ],
    live: [
        target('Hostile A', 'fighter', 10, -6, 'live'),
        target('Hostile B', 'harrier', 10, 6, 'live'),
    ],
    ally: [
        passiveTargets[0],
        { design: 'harrier', name: 'Ally', faction: allyFaction, behaviour: 'passive', position: { x: 2, y: 4, angle: 0 } },
    ],
};

/** How much each crew system is damaged by, for the `damaged` preset. */
const presetDamage = 2;

/**
 * Dev tools: somewhere to try out a card, over and over. `setUp` puts the targets the card needs around the player ship, and deals it.
 * The targets come back a little while after they're destroyed, and the encounter has no objective, so it never ends.
 * The dev tools' card range (`CardRangeSession`) loads it afresh for each card.
 */
export class CardRangeEncounter extends Encounter {
    protected override readonly factions = [
        hostileToPlayer(targetFaction),
        { id: allyFaction, relations: { [playerFactionId]: RelationshipType.Friendly } },
    ];

    private cardType: CardType | null = null;
    /** Each ship on the range, and how to bring it back if it's destroyed. */
    private readonly rangeShips = new Map<GameObject, RangeShip>();
    /** Cards put into the hull or reactor's deck (as the cards there play themselves), which are taken out again at the end. */
    private readonly addedDeckCards: { system: SystemState; card: CardState }[] = [];
    /** Power given to systems so that the card could be played, which is taken away again at the end. */
    private readonly addedPower: { system: SystemState; amount: number }[] = [];

    /** Nothing is on the range until `setUp` says what for. */
    protected populate(): void {}

    /** The card being tried out, once `setUp` has been called. */
    get currentCard(): CardType | null {
        return this.cardType;
    }

    /** Sets the range up to try out the given card, with the given preset, then deals it. Only call this once, straight after the encounter starts. */
    setUp(cardType: CardType, preset: CardRangePreset): void {
        this.cardType = cardType;

        for (const ship of presetShips[preset]) {
            this.spawnRangeShip(ship);
        }

        for (const ship of getPlayerShips(this.state)) {
            if (preset === 'damaged') {
                for (const role of crewRoleNames) {
                    ship.getCrewSystem(role).adjustHealth(-presetDamage);
                }
            } else if (preset === 'armed') {
                this.loadWeapon(ship, cardType);
            }

            this.deal(ship, cardType);
        }
    }

    /** Deals the card being tried out again, to every player ship. */
    replay(): void {
        if (!this.cardType) {
            return;
        }

        for (const ship of getPlayerShips(this.state)) {
            this.deal(ship, this.cardType);
        }
    }

    override end(): void {
        for (const { system, card } of this.addedDeckCards.splice(0)) {
            if (!system.removeDeckCard(card.id)) {
                console.warn(`[card range] Could not take ${card.type} back out of the ${system.system} deck`);
            }
        }

        for (const { system, amount } of this.addedPower.splice(0)) {
            system.adjustPowerLevel(-amount);
        }
    }

    protected override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        const ship = this.rangeShips.get(object);
        if (!ship) {
            return;
        }

        this.rangeShips.delete(object);

        if (reason === 'destroyed') {
            this.after(respawnDelayMs, () => this.spawnRangeShip(ship));
        }
    }

    private spawnRangeShip(rangeShip: RangeShip): void {
        const setup = createShipSetup(rangeShip.design, rangeShip.faction, rangeShip.position, {
            name: rangeShip.name,
            goal: { type: 'defend-position', position: rangeShip.position, radius: 2 },
            priorities: behaviourPriorities[rangeShip.behaviour],
            ...(rangeShip.behaviour === 'live' && { skill: liveSkill }),
        });

        // A target that runs off can't be tried out on.
        const ship = new AiShip(this.state, { ...setup, fleeThreshold: 0 });
        this.spawnObjects([ship]);
        this.rangeShips.set(ship, rangeShip);
    }

    /**
     * Puts a copy of the card where it can be played: in its crew member's hand, where it's expendable, so it never joins the deck, and priority, so it isn't discarded.
     * The hull and reactor's cards play themselves as they're drawn, so the card goes to the top of that system's deck instead, and is drawn.
     */
    private deal(ship: PlayerShip, cardType: CardType): void {
        const definition = getCardRangeDefinition(cardType);
        const card = new CardState(ship.getCardId(), cardType);

        if (definition.system === 'hull' || definition.system === 'reactor') {
            const system = definition.system === 'hull' ? ship.hullState : ship.reactorState;
            system.addDeckCard(card);
            system.moveDeckCard(card.id, 0);
            this.addedDeckCards.push({ system, card });
            system.drawFromTop();
            return;
        }

        const system = ship.getCrewSystem(definition.system);
        card.addTrait('expendable', ExtraTraitType.Normal);
        card.addTrait('priority', ExtraTraitType.Normal);

        this.makeRoom(system);
        this.ensurePower(system, card.getParameter('cost'));
        system.addCardToHand(card);
    }

    /** Puts a weapon in tactical's first slot, which the card can be played on: a torpedo if the card needs one, and otherwise a phaser. */
    private loadWeapon(ship: PlayerShip, cardType: CardType): void {
        const definition = getCardRangeDefinition(cardType);
        const weaponType = definition.targetType === 'weapon' && definition.requiredWeaponTrait === 'torpedoWeapon' ? 'photonTorpedo' : 'phaserCannon';

        const tactical = ship.tacticalState;
        const slot = tactical.slots[0];
        if (!slot || slot.card) {
            return;
        }

        const weapon = new CardState(ship.getCardId(), weaponType);
        weapon.addTrait('expendable', ExtraTraitType.Normal);

        this.makeRoom(tactical);
        this.ensurePower(tactical, weapon.getParameter('cost'));
        tactical.addCardToHand(weapon);

        if (!tactical.playCard(weapon.id, weaponType, 'weapon-slot', slot.id)) {
            console.warn(`[card range] Could not load ${weaponType} for ${cardType}`);
        }
    }

    private makeRoom(system: SystemState): void {
        if (system.hand.length >= system.maxHandSize) {
            system.discard();
        }
    }

    /** Raises the system's power as far as the card's cost, if it's below that, so it can be played. */
    private ensurePower(system: SystemState, cost: number): void {
        const amount = Math.min(cost, system.maxPowerLevel) - system.powerLevel;
        if (amount > 0) {
            system.adjustPowerLevel(amount);
            this.addedPower.push({ system, amount });
        }
    }
}

export const cardRangeDefinition: EncounterDefinition = {
    id: cardRangeEncounterId,
    name: 'Card Range',
    kind: 'combat',
    defaultEnvironment: 'deepSpace',
    create: (state, node) => new CardRangeEncounter(state, node),
};

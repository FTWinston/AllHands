import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { isCrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { hostileToPlayer, playerFactionId } from 'src/campaign/factions';
import { createShipSetup } from 'src/campaign/shipDesigns';
import { AiShip } from 'src/state/AiShip';
import { CardState } from 'src/state/CardState';
import { getPlayerShips } from 'src/utils/shipQueries';
import { spawnEnemies } from '../CombatEncounter';
import { Encounter } from '../Encounter';
import { chooseSignal, defaultSignal, getKitCards, getSignalCardType, signalModifiers, signalSubstances, type InspectionSignal } from './inspectionSignal';
import type { DeflectorEffectDelivery, DeflectorEffectModifier } from 'common-data/features/cards/types/CardDefinition';
import type { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';
import type { PlayerShip } from 'src/state/PlayerShip';
import type { RemovalReason } from 'src/types/RemovalReason';

const customs = 'customs';

/** The scenario id of the platform that has to be disabled. */
export const platformScenarioId = 'customsPlatform';
const platformName = 'Customs Platform 7';
const clerk = 'Dock Clerk, Tessaly Yard';
const skill = 0.6;

/** How far ahead of the player ships the platform is. */
const platformDistance = 12;
/** It engages anything this close. That's further than any weapon reaches, so it can't be shelled from outside it. */
const platformDefendRadius = 30;

/** How often the platform pings a ship that's close enough, and how close that is. It's inside the reach of all of its weapons. */
export const pingIntervalMs = 15_000;
export const pingRange = 10;

/** How many drones each wrong signal brings, and the most there can be at once. */
export const dronesPerWrongSignal = 2;
export const maxDrones = 4;
/** How far to either side of the platform its drones launch from. */
const droneSpacing = 3;

/** In the elite form, how often the platform changes what it's keyed to, once its shields are down. */
export const rekeyIntervalMs = 30_000;

const briefing = 'Manual says it stands down for an inspection signal: three parts, off your deflector. It only listens with its shields down, and it answers in kind, so match how it shoots. Please don\'t break it. We need the dock.';

/** The mark that the platform's ping leaves on a system, for each modifier it can be keyed to. A platform keyed to the default doesn't ping at all. */
const pingEffects: Partial<Record<DeflectorEffectModifier, SystemEffectType>> = {
    Phased: 'phasedPing',
    Coherent: 'coherentPing',
    Inverted: 'invertedPing',
};

/** What the platform is armed with, for each delivery it can be keyed to: it "answers in kind", so how it shoots is the clue. */
const armaments: Record<Exclude<DeflectorEffectDelivery, 'Field'>, AiShipSetupInfo['tactical']['cards']> = {
    Beam: ['phaserCannon', 'phaserCannon', 'phaserCannon'],
    Pulse: ['photonTorpedo', 'photonTorpedo', 'photonTorpedo'],
    Burst: ['phaserCannon', 'photonTorpedo', 'phaserCannon', 'photonTorpedo'],
};

type QueuedHail = { time: number; speaker: string; text: string };

/**
 * An old customs platform has impounded a supply run, and has to be disabled without being destroyed, as the dock it guards is wanted.
 * It stands down for one deflector signal, of three parts, and each part can be found out by a different seat:
 * - The substance is what its own deflector is loaded with, which science sees by scanning its science system.
 * - The modifier is the mark its ping leaves on one of the player ship's systems, which the engineer sees. It only pings a ship that's close.
 * - The delivery matches what it's armed with, which anyone watching the viewscreen sees: phasers for a beam, torpedoes for a pulse, both for a burst.
 *
 * It only listens with its shields down. A wrong signal then launches drones, and the right one ends it: the platform stands down, and its drones with it.
 * The signal is always one that the crew can build. If their science deck falls short, they're kept supplied with the scan cards it lacks.
 *
 * Elite: once its shields are down, the platform changes its modifier or its substance every so often, so what the crew worked out goes stale.
 */
export class StandingOrdersEncounter extends Encounter {
    protected override readonly factions = [hostileToPlayer(customs)];

    private platform: AiShip | undefined;
    private drones: AiShip[] = [];
    private signal: InspectionSignal = defaultSignal;
    /** Scan cards that the crew's science deck lacks, which they're kept supplied with. */
    private kit: CardType[] = [];
    private nextPingTime = 0;
    private nextRekeyTime = 0;
    private dronesLaunched = 0;
    private queuedHails: QueuedHail[] = [];

    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, objective: { type: 'disable', subject: platformName } });
    }

    /** What the platform is keyed to just now. */
    get inspectionSignal(): InspectionSignal {
        return this.signal;
    }

    override start(): void {
        super.start();

        const now = this.state.currentTime;
        this.nextPingTime = now + pingIntervalMs;
        this.hail(clerk, briefing);
        this.hailLater(getHailDuration(briefing), platformName, 'Vessel in controlled space. Cargo is impounded pending inspection. Withdraw or be assessed.');
        this.supplyKit();
    }

    protected populate(): void {
        this.signal = chooseSignal(this.state.random, this.getScienceCards());
        this.kit = getKitCards(this.signal, this.getScienceCards());

        // The player ships start at the origin facing along the x axis, and this faces back at them.
        const position = { x: platformDistance, y: 0, angle: Math.PI };
        const setup = createShipSetup('customsPlatform', customs, position, {
            scenarioId: platformScenarioId,
            name: platformName,
            goal: { type: 'defend-position', position, radius: platformDefendRadius },
            skill,
        });

        const platform = new AiShip(this.state, {
            ...setup,
            tactical: { ...setup.tactical, cards: armaments[this.signal.delivery as keyof typeof armaments] },
        });

        this.platform = platform;
        this.spawnObjects([platform]);
        this.showSubstance(platform);

        platform.deflectorReceived.addListener('standingOrders', ({ cardType }) => this.receiveSignal(platform, cardType));
    }

    override tick(_deltaTime: number): void {
        const now = this.state.currentTime;

        // What's left to be said still gets said, once it's all over.
        while (this.queuedHails.length > 0 && now >= this.queuedHails[0].time) {
            const { speaker, text } = this.queuedHails.shift()!;
            this.hail(speaker, text);
        }

        const platform = this.platform;
        if (this.isComplete || !platform) {
            return;
        }

        this.showSubstance(platform);
        this.supplyKit();

        if (now >= this.nextPingTime) {
            this.nextPingTime = now + pingIntervalMs;
            this.ping(platform, now);
        }

        if (this.node.elite && platform.hullState.shield <= 0) {
            if (this.nextRekeyTime === 0) {
                this.nextRekeyTime = now + rekeyIntervalMs;
            } else if (now >= this.nextRekeyTime) {
                this.nextRekeyTime = now + rekeyIntervalMs;
                this.rekey();
            }
        }
    }

    override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        this.drones = this.drones.filter(drone => drone !== object);

        if (object === this.platform && reason === 'destroyed' && !this.isComplete) {
            this.standDownDrones();
            this.complete('failure');
            this.queuedHails = [];
            this.hail(clerk, '...That was the dock. That was the only dock.');
        }
    }

    /** Every scan card that the first crew's science officer has to work with. */
    private getScienceCards(): CardType[] {
        const science = getPlayerShips(this.state)[0]?.scienceState;
        return science ? [...science.deck, ...science.hand].map(card => card.type) : [];
    }

    /** The platform's own deflector is loaded with the substance it's keyed to, and nothing else, for science to find by scanning it. */
    private showSubstance(platform: AiShip): void {
        platform.scienceState.presetDeflector(null, this.signal.substance, null);
    }

    /** The mark of the modifier lands on one crew system of each player ship that's close enough. */
    private ping(platform: AiShip, now: number): void {
        const effect = pingEffects[this.signal.modifier];
        if (!effect) {
            return;
        }

        const position = platform.getPosition(now);

        for (const ship of getPlayerShips(this.state)) {
            if (distance(position, ship.getPosition(now)) <= pingRange) {
                this.state.random.pick(ship.engineerState.systems.filter(tile => isCrewRoleName(tile.system))).addEffect(effect);
            }
        }
    }

    /**
     * Each science officer holds every scan card that their deck lacks for the signal, whenever it isn't already in their hand or in the deflector.
     * These are used up when the deflector is, and dealt again, so they never join the deck.
     */
    private supplyKit(): void {
        for (const ship of getPlayerShips(this.state)) {
            const held = this.getHeldScanCards(ship);

            for (const cardType of this.kit) {
                const index = held.indexOf(cardType);
                if (index !== -1) {
                    // That one's accounted for: a second of the same type would need another.
                    held.splice(index, 1);
                    continue;
                }

                const card = new CardState(ship.getCardId(), cardType);
                card.addTrait('expendable', ExtraTraitType.Normal);
                ship.scienceState.addCardToHand(card);
            }
        }
    }

    /** The scan cards that a science officer has to hand, or has already loaded into the deflector. */
    private getHeldScanCards(ship: PlayerShip): CardType[] {
        const science = ship.scienceState;
        const slotted = [science.modifierSlotCard, science.substanceSlotCard, science.deliverySlotCard];

        return [...science.hand, ...slotted].flatMap(card => (card ? [card.type] : []));
    }

    /** A deflector has been used on the platform. It ignores that with its shields up. With them down, the right signal ends it, and a wrong one costs. */
    private receiveSignal(platform: AiShip, cardType: EnemyTargetedCardType): void {
        if (this.isComplete) {
            return;
        }

        if (platform.hullState.shield > 0) {
            this.hail(platformName, 'Signal not received.');
            return;
        }

        if (cardType !== getSignalCardType(this.signal)) {
            this.launchDrones(platform);
            this.hail(platformName, 'Inspection signal invalid. Enforcement dispatched.');
            return;
        }

        this.state.factionRegistry.setRelationship(customs, playerFactionId, RelationshipType.Neutral);
        this.standDownDrones();
        this.complete('success');

        const accepted = 'Inspection accepted. Transit granted. Have a compliant day.';
        this.queuedHails = [];
        this.hail(platformName, accepted);
        this.hailLater(getHailDuration(accepted), clerk, 'Three weeks! Three weeks, and it wanted a form. Thank you.');
    }

    private launchDrones(platform: AiShip): void {
        const { x, y } = platform.getPosition(this.state.currentTime);
        const count = Math.min(dronesPerWrongSignal, maxDrones - this.drones.length);

        const drones = spawnEnemies(this.state, customs, Array.from({ length: count }, (_, index) => ({
            design: 'drone' as const,
            name: `Drone ${++this.dronesLaunched}`,
            position: { x, y: y + (index % 2 === 0 ? droneSpacing : -droneSpacing), angle: Math.PI },
            skill,
        })));

        this.drones.push(...drones);
        this.spawnObjects(drones);
    }

    /** The drones go when the platform does, one way or the other: there's nothing left telling them what to do. */
    private standDownDrones(): void {
        for (const drone of [...this.drones]) {
            drone.depart();
        }
    }

    /** The platform changes its modifier or its substance for another, so whatever the crew had worked out is now wrong in one part. */
    private rekey(): void {
        const signal = this.state.random.getBoolean(0.5)
            ? { ...this.signal, modifier: this.state.random.pick(signalModifiers.filter(modifier => modifier !== this.signal.modifier)) }
            : { ...this.signal, substance: this.state.random.pick(signalSubstances.filter(substance => substance !== this.signal.substance)) };

        this.signal = signal;
        this.kit = getKitCards(signal, this.getScienceCards());
    }

    private hailLater(delayMs: number, speaker: string, text: string): void {
        this.queuedHails.push({ time: this.state.currentTime + delayMs, speaker, text });
    }
}

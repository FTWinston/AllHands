import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { hostileToPlayer, playerFactionId } from 'engine/campaign/factions';
import { createShipSetup } from 'engine/campaign/shipDesigns';
import { Encounter } from 'engine/encounters/Encounter';
import { AiShip } from 'engine/state/AiShip';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { EncounterDefinition } from 'engine/encounters/EncounterDefinition';
import type { GameObject } from 'engine/state/GameObject';
import type { RemovalReason } from 'engine/types/RemovalReason';

const ostlerFaction = 'ostler';

/** The scenario id of the hauler that has to be stopped. */
export const ostlerScenarioId = 'ostler';
const ostlerName = 'Hauler Ostler';
const ostlerCrew = 'Ostler\'s Crew';
const skill = 0.7;

/** How far ahead of the player ships Ostler starts, facing them. */
const ostlerDistance = 12;

/**
 * How much more power the system running the update has than the rest: they run at 2, and it at 5. It isn't given reactor cards for it, so it draws no faster than they do:
 * with three more, an infected tactical drew four times as often, and destroyed a crew that did nothing in under two minutes.
 */
export const infectedPowerBoost = 3;
/** How much more power each of her other crew systems gets, the first time each healthy one is put out. */
export const digInPower = 1;
/** How long a healthy system that's been put out stays out, before the update reroutes around the damage and it's back. */
export const rerouteMs = 20_000;

/**
 * The deck that each crew system has instead of a hauler's own, while it's running the update. Each one shows: a hauler flying like a fighter,
 * torpedoes from a ship that had a cutting beam, sensor scans that leave marks on what they scan, and power cards meant for a warship's engineer.
 * Their order is the order they're drawn in, so the first is in the hand from the start.
 */
export const warshipDecks: Readonly<Record<CrewRoleName, readonly CardType[]>> = {
    helm: ['zigZag', 'sweep', 'zigZag', 'sweep', 'strafe'],
    tactical: ['photonTorpedo', 'phaserCannon', 'photonTorpedo', 'phaserCannon', 'photonTorpedo'],
    science: ['antiprotonScan', 'chronitonScan', 'antiprotonScan', 'chronitonScan', 'antiprotonScan'],
    engineer: ['overcharge', 'overcharge', 'overcharge', 'distributePower', 'drawPower'],
};

const briefing = 'It\'s in one system. One of the four, and it\'s driving that one flat out. Knock that one out and she stops. Knock out the wrong one and it digs in. Go gently. We\'re in here.';

/**
 * A hauler has taken a software update meant for a warship, and its crew are locked out of it. It has to be stopped without being sunk.
 * - The update is in one of her four crew systems, picked at random. That system runs at 5 power where the others run at 2, holds a warship's cards
 *   in place of a hauler's, and plays them: so science can tell it by its power or its hand, and whoever's watching by how she behaves.
 * - Putting that system out (every card of it damaged) stops her: she goes neutral, and it's a success.
 * - Putting out a healthy one makes the update dig in: her other crew systems gain power, once for each. The healthy one is back a little later.
 * - Destroying her is a failure. Her own engineer can't repair anything, so her hull is the crew's budget for getting it wrong.
 *
 * Elite: the update moves once. When its system is put out, its power jumps to another working system, and that one has to be found by its power alone.
 */
export class FeverShipEncounter extends Encounter {
    protected override readonly factions = [hostileToPlayer(ostlerFaction)];

    private ostler: AiShip | undefined;
    private infected: CrewRoleName = 'helm';
    /** Whether the update has moved yet, in the elite form. It only moves once. */
    private moved = false;
    /** The system the update moved out of, which stays out. */
    private abandoned: CrewRoleName | null = null;
    /** The crew systems that are out just now. */
    private readonly out = new Set<CrewRoleName>();
    /** The healthy systems whose loss has already made the update dig in. */
    private readonly dugInFor = new Set<CrewRoleName>();
    private hullLineSaid = false;

    /** The crew system running the update just now. */
    get infectedSystem(): CrewRoleName {
        return this.infected;
    }

    override start(): void {
        super.start();

        this.hail(ostlerCrew, briefing);
        this.hail(ostlerName, 'FLEET DOCTRINE NINE. HOSTILE CONTACT. ENGAGING.');
    }

    protected populate(): void {
        const infected = this.state.random.pick(crewRoleNames);
        this.infected = infected;

        // The player ships start at the origin facing along the x axis, and she faces back at them.
        const position = { x: ostlerDistance, y: 0, angle: Math.PI };
        const setup = createShipSetup('hauler', ostlerFaction, position, {
            scenarioId: ostlerScenarioId,
            name: ostlerName,
            skill,
        });

        const ostler = new AiShip(this.state, infect(setup, infected));
        ostler.getCrewSystem(infected).adjustPowerLevel(infectedPowerBoost);

        // Her crew are locked out, and nothing aboard her repairs anything: whatever the crew breaks stays broken, unless the update reroutes around it.
        ostler.engineerState.maxRepairCapacity = 0;
        ostler.engineerState.repairCapacity = 0;

        this.ostler = ostler;
        this.spawnObjects([ostler]);
    }

    protected override tick(): void {
        const ostler = this.ostler;
        if (this.isComplete || !ostler) {
            return;
        }

        for (const role of crewRoleNames) {
            const isOut = ostler.getCrewSystem(role).health <= 0;

            if (!isOut) {
                this.out.delete(role);
            } else if (!this.out.has(role)) {
                this.out.add(role);
                this.putOut(ostler, role);

                if (this.isComplete) {
                    return;
                }
            }
        }

        if (!this.hullLineSaid && ostler.hullState.health <= ostler.hullState.maxHealth / 2) {
            this.hullLineSaid = true;
            this.hail(ostlerCrew, 'We felt that. She wasn\'t built to be shot at.');
        }
    }

    protected override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        if (object === this.ostler && reason === 'destroyed' && !this.isComplete) {
            this.complete('failure');
            this.silence();
        }
    }

    /** One of her crew systems has had every card damaged. */
    private putOut(ostler: AiShip, role: CrewRoleName): void {
        if (role === this.abandoned) {
            return;
        }

        if (role !== this.infected) {
            this.healthyPutOut(ostler, role);
        } else if (this.node.elite && !this.moved) {
            this.moveUpdate(ostler, role);
        } else {
            this.stop();
        }
    }

    /** The wrong system: the update digs in, the first time for each, and reroutes around the damage a little later. */
    private healthyPutOut(ostler: AiShip, role: CrewRoleName): void {
        this.after(rerouteMs, () => {
            const system = ostler.getCrewSystem(role);
            system.adjustHealth(system.maxHealth);
        });

        if (this.dugInFor.has(role)) {
            return;
        }

        this.dugInFor.add(role);

        for (const other of crewRoleNames) {
            if (other !== role) {
                ostler.getCrewSystem(other).adjustPowerLevel(digInPower);
            }
        }

        this.hail(ostlerName, 'SUBSYSTEM LOST. REALLOCATING.', { urgent: true });
        this.hail(ostlerCrew, 'Not that one! She\'s running hotter.', { urgent: true });
    }

    /** Elite: the update restores itself into another of her crew systems that's still working. Its power goes with it, but its cards don't. */
    private moveUpdate(ostler: AiShip, from: CrewRoleName): void {
        const candidates = crewRoleNames.filter(role => role !== from && ostler.getCrewSystem(role).health > 0);
        if (candidates.length === 0) {
            this.stop();
            return;
        }

        const to = this.state.random.pick(candidates);
        this.moved = true;
        this.abandoned = from;
        this.infected = to;

        ostler.getCrewSystem(from).adjustPowerLevel(-infectedPowerBoost);
        ostler.getCrewSystem(to).adjustPowerLevel(infectedPowerBoost);

        this.hail(ostlerName, 'DOCTRINE RESTORED FROM BACKUP.', { urgent: true });
        this.hail(ostlerCrew, 'It\'s moved. It\'s somewhere else now.', { urgent: true });
    }

    /** The update is out: she stops fighting, and her crew have their ship back. */
    private stop(): void {
        this.state.factionRegistry.setRelationship(ostlerFaction, playerFactionId, RelationshipType.Neutral);
        this.complete('success');

        this.silence();
        this.hail(ostlerName, 'DOCTRINE... NINE...');
        this.hail(ostlerCrew, 'She\'s stopped. We\'ve got the engine room. Thank you, and sorry about your paintwork.');
    }
}

/** A hauler with the update in one of its crew systems: that system has a warship's deck in place of its own. */
function infect(setup: AiShipSetupInfo, role: CrewRoleName): AiShipSetupInfo {
    switch (role) {
        case 'helm':
            return { ...setup, helm: { ...setup.helm, cards: [...warshipDecks.helm] as AiShipSetupInfo['helm']['cards'] } };
        case 'tactical':
            return { ...setup, tactical: { ...setup.tactical, cards: [...warshipDecks.tactical] as AiShipSetupInfo['tactical']['cards'] } };
        case 'science':
            return { ...setup, science: { ...setup.science, cards: [...warshipDecks.science] as AiShipSetupInfo['science']['cards'] } };
        case 'engineer':
            return { ...setup, engineer: { ...setup.engineer, cards: [...warshipDecks.engineer] as AiShipSetupInfo['engineer']['cards'] } };
    }
}

export const feverShipDefinition: EncounterDefinition = {
    id: 'feverShip',
    name: 'Fever Ship',
    kind: 'combat',
    objective: { type: 'disable', subject: 'Ostler' },
    defaultEnvironment: 'deepSpace',
    request: {
        from: ostlerName,
        subject: 'ship out of control',
        text: 'This is Ostler\'s crew, not Ostler. She took an update meant for a warship and she\'s locked us out. We\'re cutting through to the engine room. Stop her shooting, and don\'t sink her. We\'re still aboard.',
    },
    create: (state, node) => new FeverShipEncounter(state, node),
};

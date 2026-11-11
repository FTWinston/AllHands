import { hostileToPlayer } from '../campaign/factions';
import { noHostilesRemain, spawnEnemies } from './CombatEncounter';
import { Encounter } from './Encounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { AiShip } from 'src/state/AiShip';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';
import type { RemovalReason } from 'src/types/RemovalReason';

const wardens = 'wardens';
const assize = 'Warden Cruiser Assize';

/** The scenario id of the cruiser holding the jump point, which its escorts guard. */
export const tollCruiserScenarioId = 'tollCruiser';

/** How far ahead of the player ships the jump point is. */
const jumpPointDistance = 14;
/** The cruiser engages anything this close to the jump point. It's further than any weapon reaches, so the cruiser can't be shelled from outside it. */
const cruiserDefendRadius = 30;
/** How far to either side of the cruiser its escorts start. */
const escortSpacing = 3;
/** How long into an elite encounter the second cruiser arrives, if the first is still holding the jump point. */
export const eliteReinforcementMs = 120_000;
const skill = 0.7;

/**
 * A cruiser holds a jump point with two escorts, and the area has to be cleared of all three. How they go is the crew's choice:
 * - A cruiser whose shields are knocked out withdraws, and the first one takes its escorts with it.
 * - An escort flees once it's damaged enough, like any other harrier.
 * - If the first cruiser is destroyed instead, even as it withdraws, whichever escorts are still here hunt the player ships, and no longer flee.
 *
 * Elite: a second cruiser arrives after a while, unless the first has gone by then.
 */
export class TollCollectorsEncounter extends Encounter {
    protected override readonly factions = [hostileToPlayer(wardens)];

    private firstCruiser: AiShip | undefined;
    private cruisers: AiShip[] = [];
    private escorts: AiShip[] = [];
    private startTime = 0;
    /** Whether the first cruiser has withdrawn or been destroyed. */
    private firstCruiserGone = false;
    private reinforced = false;

    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, objective: { type: 'clear' } });
    }

    override start(): void {
        super.start();
        this.startTime = this.state.currentTime;
        this.hail(assize, 'Unregistered vessel. Transit duty is forty percent of cargo. Heave to for assessment.');
    }

    protected populate(): void {
        // The player ships start at the origin facing along the x axis, and these face back at them.
        const position = (y: number) => ({ x: jumpPointDistance, y, angle: Math.PI });

        const [cruiser, ...escorts] = spawnEnemies(this.state, wardens, [
            {
                design: 'bulwark',
                scenarioId: tollCruiserScenarioId,
                name: assize,
                position: position(0),
                goal: { type: 'defend-position', position: position(0), radius: cruiserDefendRadius },
                skill,
            },
            { design: 'harrier', name: 'Escort One', guards: tollCruiserScenarioId, position: position(-escortSpacing), skill },
            { design: 'harrier', name: 'Escort Two', guards: tollCruiserScenarioId, position: position(escortSpacing), skill },
        ]);

        this.firstCruiser = cruiser;
        this.cruisers = [cruiser];
        this.escorts = escorts;
        this.spawnObjects([cruiser, ...escorts]);
    }

    override tick(_deltaTime: number): void {
        if (this.isComplete) {
            return;
        }

        for (const cruiser of this.cruisers) {
            if (cruiser.hullState.shield <= 0 && !cruiser.ai.commander.isWithdrawing) {
                this.withdraw(cruiser);
            }
        }

        if (this.node.elite && !this.reinforced && !this.firstCruiserGone && this.state.currentTime - this.startTime >= eliteReinforcementMs) {
            this.reinforce();
        }
    }

    override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        this.cruisers = this.cruisers.filter(cruiser => cruiser !== object);
        this.escorts = this.escorts.filter(escort => escort !== object);

        if (object === this.firstCruiser) {
            this.firstCruiserGone = true;

            if (reason === 'destroyed') {
                // With nothing left to guard, the escorts hunt (see `Commander`), and now they do it to the end.
                // That goes for any that were leaving with it, too: finishing off a cruiser that has given up brings them back.
                for (const escort of this.escorts) {
                    escort.ai.commander.rally();
                    escort.ai.commander.standFast();
                }

                if (this.escorts.length > 0) {
                    this.hail(this.escorts[0].name, 'Assize is gone. No quarter.');
                }
            }
        }

        if (noHostilesRemain(this.state)) {
            this.complete();
            this.hail('Hauler Local 12', 'Point\'s clear. We\'ll take it from here. Drinks are on the Local.');
        }
    }

    /** A cruiser that has lost its shields gives up the jump point. The first one takes its escorts with it. */
    private withdraw(cruiser: AiShip): void {
        cruiser.ai.commander.withdraw();
        this.hail(cruiser.name, 'Cost exceeds mandate. Withdrawing.');

        if (cruiser !== this.firstCruiser) {
            return;
        }

        this.firstCruiserGone = true;

        for (const escort of this.escorts) {
            escort.ai.commander.withdraw();
        }
    }

    /** A second cruiser arrives behind the player ships, and comes after them. */
    private reinforce(): void {
        this.reinforced = true;

        const [cruiser] = spawnEnemies(this.state, wardens, [
            { design: 'bulwark', name: 'Warden Cruiser Tithe', position: { x: -jumpPointDistance, y: 0, angle: 0 }, skill },
        ]);

        this.cruisers.push(cruiser);
        this.spawnObjects([cruiser]);
        this.hail(cruiser.name, 'Assize, we have your signal. Engaging.');
    }
}

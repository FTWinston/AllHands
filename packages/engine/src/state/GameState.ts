import { Schema, type, MapSchema, view } from '@colyseus/schema';
import { ClockTimer } from '@colyseus/timer';
import { Random } from 'common-data/classes/Random';
import { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { IRandom } from 'common-data/types/IRandom';
import { IdProvider } from 'src/types/IdProvider';
import { FactionRegistry } from '../classes/FactionRegistry';
import { GameStatus } from '../types/GameStatus';
import { CrewState } from './CrewState';
import { EncounterSummaryState } from './EncounterSummaryState';
import { FactionState } from './FactionState';
import { GameObject } from './GameObject';
import { SectorMapState } from './SectorMapState';
import { SectorMessageState } from './SectorMessageState';
import type { Campaign } from '../campaign/Campaign';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SceneChange } from 'common-data/features/sectors/types/SceneChange';

export class GameState extends Schema {
    @type('string') gameStatus: GameStatus = 'setup';
    /** Whole seconds until the game starts, once every role is claimed during setup; 0 when not counting down. */
    @type('number') startCountdown = 0;
    /** Null until the campaign starts. */
    @type('string') phase: GamePhase | null = null;
    @type('string') outcome: GameOutcome | null = null;
    /** The current sector's graph and position (no node details); null before the first sector starts. */
    @type(SectorMapState) map: SectorMapState | null = null;
    /** The sector intro/outro message awaiting tactical's dismissal; null when none. */
    @type(SectorMessageState) message: SectorMessageState | null = null;
    /** Set while every screen fades to black ahead of a scene change (see `changeScene`); null otherwise. */
    @type('string') sceneChange: SceneChange | null = null;
    /** Server-only. How long screens get to fade to black before the scene changes. Zero changes it straight away, e.g. in tests. */
    sceneChangeDelay = 1100;
    /** Server-only. Summary of the running encounter; null outside the encounter phase. */
    encounter: EncounterSummaryState | null = null;
    @view() @type({ map: GameObject }) objects = new MapSchema<GameObject>();
    @view() @type({ map: CrewState }) crews = new MapSchema<CrewState>();
    @view() @type({ map: FactionState }) factions = new MapSchema<FactionState>();
    public readonly random: IRandom;
    public readonly factionRegistry = new FactionRegistry(this.factions);
    public playerFaction: string | null = null;
    public campaign: Campaign | null = null;

    /** The current scaled game time, in milliseconds. Use this instead of clock.currentTime for all game logic. */
    public currentTime: number;

    /** Multiplier applied to all time-dependent logic. A value of 2 makes everything run twice as fast. */
    public timeScale: number;

    /** Dev tools: when set, each encounter starts with its objective already met and nothing spawned. */
    public devAutoWin = false;

    constructor(private readonly idPool: IdProvider, private readonly clock: ClockTimer, timeScale: number = 1, random?: IRandom) {
        super();
        this.random = random ?? new Random(Math.random);
        this.currentTime = clock.currentTime;
        this.timeScale = timeScale;
    }

    /** Maps scenario-authored `scenarioId`s to the runtime id of the most recently added object that declared them. */
    private readonly scenarioIdIndex = new Map<string, string>();

    public getNewId(): string {
        return this.idPool.getId();
    }

    public add(object: GameObject) {
        this.objects.set(object.id, object);

        if (object.scenarioId !== null) {
            this.scenarioIdIndex.set(object.scenarioId, object.id);
        }
    }

    /**
     * Resolves a scenario-authored id (see `GameObjectSetupInfo.id`) to the live game object
     * that currently owns it, if any.
     */
    public getObjectByScenarioId(scenarioId: string): GameObject | undefined {
        const id = this.scenarioIdIndex.get(scenarioId);
        return id !== undefined ? this.objects.get(id) : undefined;
    }

    public initFactions(configs: FactionConfig[], playerFaction: string) {
        this.factionRegistry.init(configs);
        this.playerFaction = playerFaction;
    }

    public remove(object: GameObject) {
        // Views must be updated while the object is still attached to `objects`; once it's
        // deleted its parent link is gone and the view can't queue the DELETE for clients.
        if (this.gameStatus === 'active') {
            for (const crew of this.crews.values()) {
                crew.removeObjectFromViews(object);
            }
        }

        this.objects.delete(object.id);

        if (object.scenarioId !== null && this.scenarioIdIndex.get(object.scenarioId) === object.id) {
            this.scenarioIdIndex.delete(object.scenarioId);
        }

        this.idPool.releaseId(object.id);

        this.campaign?.onObjectRemoved(object);
    }

    /**
     * Schedule a callback after a delay, automatically adjusted by timeScale.
     * Use this instead of clock.setTimeout for all game logic delays.
     */
    public setTimeout(callback: () => void, delay: number) {
        return this.clock.setTimeout(callback, delay / this.timeScale);
    }

    /**
     * Fade every screen to black, then make the change once they are. Screens fade back in once `sceneChange` clears.
     * Returns false, doing nothing, if a scene change is already under way.
     */
    public changeScene(kind: SceneChange, change: () => void): boolean {
        if (this.sceneChange) {
            return false;
        }

        if (this.sceneChangeDelay <= 0) {
            change();
            return true;
        }

        this.sceneChange = kind;
        this.setTimeout(() => {
            this.sceneChange = null;
            change();
        }, this.sceneChangeDelay);
        return true;
    }

    /** Ship systems (card draws, timers) only run during an encounter; game time itself always advances. */
    public get isSimulatingSystems(): boolean {
        return !this.campaign || this.campaign.isInEncounter;
    }

    public tick(deltaTime: number) {
        const scaledDelta = deltaTime * this.timeScale;
        this.currentTime += scaledDelta;

        for (const object of this.objects.values()) {
            object.tick(scaledDelta, this.currentTime);
        }

        this.campaign?.tick(scaledDelta);
    }

    /**
     * Send a weapon effect message to all crews that have visibility of the source object.
     */
    public broadcastWeaponEffect(effect: WeaponEffect) {
        for (const crew of this.crews.values()) {
            const ship = crew.ship;
            if (!ship) {
                continue;
            }

            // Send to crew if their ship is the source, or if the source is in their known objects.
            if (ship.id === effect.sourceId || ship.knownObjects.has(effect.sourceId)) {
                crew.sendWeaponEffect(effect);
            }
        }
    }
}

import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { ListenableEvent } from 'src/classes/ListenableEvent';
import { CardState } from 'src/state/CardState';
import { PromptState } from 'src/state/PromptState';
import { getPlayerShips } from 'src/utils/shipQueries';
import { HailQueue, type HailOptions } from './HailQueue';
import { createShips, type ShipSpawn } from './shipSpawns';
import { TrackedObjects } from './TrackedObjects';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { EncounterOutcome } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { PromptOptionInfo } from 'common-data/features/sectors/types/PromptInfo';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import type { AiShip } from 'src/state/AiShip';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';
import type { CrewSystemState } from 'src/state/systems/CrewSystemState';
import type { RemovalReason } from 'src/types/RemovalReason';

/** One of the answers to something the crew is asked (see `Encounter.ask`), and what happens if it's the one given. */
export interface PromptAnswer extends PromptOptionInfo {
    onChosen(): void;
}

export interface AskOptions {
    /** How long the crew has to answer, in game time. It's never less than the time it takes to read the question, however fast the clock. */
    timeoutMs: number;
    /** The id of the answer that's given if time runs out. */
    defaultAnswer: string;
}

/** Something that an encounter has set to happen later (see `Encounter.after` and `Encounter.every`). */
export interface EncounterTimer {
    /** Stops it from happening, or from happening again. */
    cancel(): void;
}

interface ScheduledTimer extends EncounterTimer {
    dueTime: number;
    /** How long after each time it happens it happens again, or null if it only happens once. */
    intervalMs: number | null;
    callback: () => void;
    cancelled: boolean;
}

/**
 * One node's worth of gameplay: spawns what it needs, decides when its objective is met or failed, and reports
 * that via `onComplete`. The `Campaign` owns the lifecycle (start, update, removal notifications)
 * and the environment is purely informational (it is carried to clients through the encounter summary).
 *
 * Subclasses override `populate`, and usually `tick` and `onObjectRemoved`. Everything an encounter is likely to need beyond that is here:
 * timers (`after`, `every`), groups of objects that keep themselves up to date (`track`), speech (`hail`), questions (`ask`)
 * and cards kept in the crew's hands (`keepInHand`).
 */
export abstract class Encounter {
    private _outcome: EncounterOutcome | null = null;
    private _score = 1;
    private readonly hails: HailQueue;
    /** The answers to what's being asked, or null when nothing is. */
    private answers: readonly PromptAnswer[] | null = null;
    private defaultAnswer: string | null = null;
    private timers: ScheduledTimer[] = [];
    private readonly trackedGroups: TrackedObjects<GameObject>[] = [];
    /** The cards kept in hands (see `keepInHand`), and whose hand each is kept in. */
    private readonly keptCards = new Map<CardState, CrewSystemState>();

    /** Fired once, when the encounter becomes complete. */
    readonly onComplete = new ListenableEvent();

    constructor(protected readonly state: GameState, public readonly node: SectorNodeInfo) {
        this.hails = new HailQueue(state);
    }

    /**
     * Everyone here other than the player ships, and how they relate to each other and to the player faction (see `playerFactionId`).
     * They only exist for as long as the encounter does: nothing relates to anything else from one encounter to the next.
     */
    protected readonly factions: readonly FactionConfig[] = [];

    /** True once the encounter's objective has been met or failed. */
    get isComplete(): boolean {
        return this._outcome !== null;
    }

    /** Whether the objective was met or failed, or null while the encounter is still undecided. */
    get outcome(): EncounterOutcome | null {
        return this._outcome;
    }

    /** How well a completed encounter went, from 0 to 1. Always 1 unless it's one that grades its outcome. */
    get score(): number {
        return this._score;
    }

    /** Game time (ms) at which a timed objective completes, or 0. */
    get objectiveEndTime(): number {
        return 0;
    }

    /** Declares the encounter's factions and spawns its objects. Subclasses override this to also evaluate their objective. */
    start(): void {
        this.state.factionRegistry.setEncounterFactions(this.factions);
        this.populate();
    }

    /** Dev tools: starts the encounter as though its objective had already been met, without spawning anything. */
    startComplete(): void {
        this.complete();
    }

    /**
     * Called by the campaign on every tick of the encounter: answers what's being asked if time has run out, runs any timers that are due,
     * then `tick`, then moves on what's being said. It carries on once the encounter is complete, until the crew has left, so last words still get said.
     */
    update(deltaTime: number): void {
        const prompt = this.state.prompt;
        if (this.answers && prompt && this.state.currentTime >= prompt.countdown.endTime) {
            this.answerPrompt(null);
        }

        this.runTimers();
        this.tick(deltaTime);
        this.hails.update();
    }

    /** Called by the campaign whenever an object leaves the game: it's dropped from every group made by `track`, then `onObjectRemoved` is called. */
    objectRemoved(object: GameObject, reason: RemovalReason): void {
        for (const group of this.trackedGroups) {
            group.remove(object);
        }

        this.onObjectRemoved(object, reason);
    }

    /** Called on every tick, including after the encounter is complete. Timers set with `after` and `every` have already run. */
    protected tick(_deltaTime: number): void {}

    /** Called whenever an object leaves the game, after it's been dropped from every group made by `track`. */
    protected onObjectRemoved(_object: GameObject, _reason: RemovalReason): void {}

    /** Creates the encounter's initial objects. */
    protected abstract populate(): void;

    /**
     * Marks the encounter complete and fires `onComplete`; does nothing if already complete. Only encounters that grade their outcome pass a score.
     * Every timer is cancelled, and whatever was being asked goes unanswered.
     */
    protected complete(outcome: EncounterOutcome = 'success', score = 1): void {
        if (this._outcome !== null) {
            return;
        }

        this._outcome = outcome;
        this._score = Math.max(0, Math.min(1, score));

        // There's nothing left to decide, so nothing left to ask, and nothing left to happen.
        this.clearPrompt();
        for (const timer of this.timers) {
            timer.cancel();
        }

        this.onComplete.triggerListeners();
    }

    /** Has the callback called once, after this much game time. Timers only run while the encounter is undecided. */
    protected after(delayMs: number, callback: () => void): EncounterTimer {
        return this.addTimer(delayMs, null, callback);
    }

    /**
     * Has the callback called every so often, in game time: first after `firstAfterMs` (by default, the interval), then each interval after that.
     * If the game jumps ahead by several intervals at once, it's only called the once. Timers only run while the encounter is undecided.
     */
    protected every(intervalMs: number, callback: () => void, firstAfterMs = intervalMs): EncounterTimer {
        return this.addTimer(firstAfterMs, intervalMs, callback);
    }

    private addTimer(delayMs: number, intervalMs: number | null, callback: () => void): EncounterTimer {
        const timer: ScheduledTimer = {
            dueTime: this.state.currentTime + delayMs,
            intervalMs,
            callback,
            cancelled: this.isComplete,
            cancel() {
                this.cancelled = true;
            },
        };

        this.timers.push(timer);
        return timer;
    }

    private runTimers(): void {
        const now = this.state.currentTime;

        for (const timer of [...this.timers]) {
            // One that's run already may have cancelled it.
            if (timer.cancelled || now < timer.dueTime) {
                continue;
            }

            if (timer.intervalMs === null) {
                timer.cancel();
            } else {
                timer.dueTime = now + timer.intervalMs;
            }

            timer.callback();
        }

        this.timers = this.timers.filter(timer => !timer.cancelled);
    }

    /** A group of the encounter's objects, which drop out of it as they leave the game, whether destroyed or departed. */
    protected track<T extends GameObject>(...objects: T[]): TrackedObjects<T> {
        const group = new TrackedObjects<T>();
        group.add(...objects);
        this.trackedGroups.push(group);
        return group;
    }

    /**
     * Adds a batch of newly-created objects to the game state, then resolves any scenario-authored
     * references between them (e.g. a `guard-ship` goal naming another object in the same batch by
     * `scenarioId`) — see `GameObject.resolveScenarioReferences`. Resolution happens only after every
     * object in the batch has been added, so references work regardless of array order. Use this
     * instead of calling `state.add` directly for any objects built from setup info.
     */
    protected spawnObjects(objects: readonly GameObject[]): void {
        for (const object of objects) {
            this.state.add(object);
        }

        for (const object of objects) {
            object.resolveScenarioReferences();
        }
    }

    /** Creates AI ships in one of the encounter's factions, and adds them to the game as one batch (see `spawnObjects`). */
    protected spawnShips(faction: string, spawns: readonly ShipSpawn[]): AiShip[] {
        const ships = createShips(this.state, faction, spawns);
        this.spawnObjects(ships);
        return ships;
    }

    /**
     * Has someone say something over comms, which the viewscreen shows for long enough to read it.
     * This is how the people here get a voice, and how the crew hears things it can't see for itself, like how an ally is doing.
     * Lines are said one after another, in the order they're hailed, except that urgent ones go first (see `HailOptions`).
     */
    protected hail(speaker: string, text: string, options?: HailOptions): void {
        this.hails.say(speaker, text, options);
    }

    /** Whether anything is being said over comms, or waiting to be. Chatter that's only worth saying straight away can wait for this to be false. */
    protected get isHailing(): boolean {
        return this.hails.isBusy;
    }

    /** Cuts off whatever is being said over comms, and drops anything that was waiting to be said. */
    protected silence(): void {
        this.hails.silence();
    }

    /**
     * Has someone ask the crew something over comms. The viewscreen shows it to the whole bridge, and tactical answers by picking one of the answers.
     * If nobody has by the time it runs out, it gets the default answer. Either way, that answer's `onChosen` is then called, once.
     * Only one thing can be asked at a time: this replaces anything that's still waiting for its answer, which then never gets one.
     * Hails carry on while it waits, and the viewscreen shows them above it.
     */
    protected ask(speaker: string, text: string, answers: readonly PromptAnswer[], { timeoutMs, defaultAnswer }: AskOptions): void {
        const now = this.state.currentTime;
        // Reading takes real time, so a faster clock needs more game time for it.
        const duration = Math.max(timeoutMs, getHailDuration(text) * this.state.timeScale);

        this.answers = answers;
        this.defaultAnswer = defaultAnswer;
        this.state.prompt = new PromptState(speaker, text, answers.map(({ id, label }) => ({ id, label })), now, now + duration);
    }

    /**
     * Answers what's being asked, if anything is, and that's one of its answers. Null gives its default answer, as running out of time does.
     * Returns whether the answer was accepted.
     */
    answerPrompt(answerId: string | null): boolean {
        const id = answerId ?? this.defaultAnswer;
        const answer = this.answers?.find(candidate => candidate.id === id);

        if (!answer) {
            return false;
        }

        this.clearPrompt();
        answer.onChosen();
        return true;
    }

    private clearPrompt(): void {
        this.answers = null;
        this.defaultAnswer = null;
        this.state.prompt = null;
    }

    /**
     * Keeps a card of this type in the hand of the given crew member on every player ship, for as long as the encounter lasts.
     * It's primary, so it comes back to the hand whenever it's played or used up, rather than going to the deck; expendable,
     * so it never joins the deck, and is gone once the encounter is over; and priority, so it can't be discarded.
     */
    protected keepInHand(role: CrewRoleName, cardType: CardType): CardState[] {
        return getPlayerShips(this.state).map((ship) => {
            const system = ship.getCrewSystem(role);
            const card = new CardState(ship.getCardId(), cardType);

            for (const trait of ['primary', 'expendable', 'priority'] as const) {
                card.addTrait(trait, ExtraTraitType.Normal);
            }

            system.addCardToHand(card);
            this.keptCards.set(card, system);
            return card;
        });
    }

    /** Stops keeping these cards in hand (see `keepInHand`): any that are in a hand go now, and any that are in use go once they've been used. */
    protected stopKeeping(cards: Iterable<CardState>): void {
        for (const card of cards) {
            const system = this.keptCards.get(card);
            if (!system) {
                continue;
            }

            this.keptCards.delete(card);
            card.removeTrait('primary');

            system.removeCard(card.id);
        }
    }
}

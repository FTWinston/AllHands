import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { Encounter } from './Encounter';
import { getDefaultNode } from './EncounterRegistry';
import type { EncounterOutcome } from 'common-data/features/sectors/types/ObjectiveInfo';

const rooms = setupGameRoom();

/** An encounter that does nothing but ask what it's told to, and note the answers. */
class AskingEncounter extends Encounter {
    readonly given: string[] = [];

    protected populate(): void {}

    askSomething(text = 'Well?', timeoutMs = 20_000, note = ''): void {
        this.ask('Someone', text, [
            { id: 'yes', label: 'Agree', onChosen: () => this.given.push(`yes${note}`) },
            { id: 'no', label: 'Refuse', onChosen: () => this.given.push(`no${note}`) },
        ], { timeoutMs, defaultAnswer: 'no' });
    }

    finish(outcome: EncounterOutcome): void {
        this.complete(outcome);
    }
}

function createAskingEncounter() {
    const state = rooms.createState(seededRandom(3));
    const { campaign } = startCampaign(state);
    const encounter = new AskingEncounter(state, getDefaultNode('skirmish'));
    encounter.start();
    return { state, campaign, encounter };
}

describe('Encounter prompts', () => {
    it('ask the crew something, with the answers it could give and how long it has to give one', () => {
        const { state, encounter } = createAskingEncounter();
        expect(state.prompt).toBeNull();

        encounter.askSomething('Hand it over?', 15_000);

        expect(state.prompt).toMatchObject({ speaker: 'Someone', text: 'Hand it over?' });
        expect(state.prompt!.options.map(option => ({ id: option.id, label: option.label }))).toEqual([{ id: 'yes', label: 'Agree' }, { id: 'no', label: 'Refuse' }]);
        expect(state.prompt!.countdown).toMatchObject({ startTime: state.currentTime, endTime: state.currentTime + 15_000 });
    });

    it('always give long enough to read the question, however fast the game clock', () => {
        const { state, encounter } = createAskingEncounter();
        const text = 'There\'s two hundred of us on a dead hauler, and that ship\'s carrying antibiotics. A third of the stores and we\'re gone. Your call.';
        state.timeScale = 4;

        encounter.askSomething(text, 1000);

        expect(state.prompt!.countdown.endTime - state.prompt!.countdown.startTime).toBe(getHailDuration(text) * 4);
    });

    it('take one of the answers on offer, once', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.askSomething();

        expect(encounter.answerPrompt('yes')).toBe(true);
        expect(encounter.given).toEqual(['yes']);
        expect(state.prompt).toBeNull();

        // It's been answered, so there's nothing left to answer.
        expect(encounter.answerPrompt('no')).toBe(false);
        expect(encounter.given).toEqual(['yes']);
    });

    it('refuse an answer that isn\'t on offer, and keep waiting', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.askSomething();

        expect(encounter.answerPrompt('maybe')).toBe(false);
        expect(encounter.given).toEqual([]);
        expect(state.prompt).not.toBeNull();
    });

    it('refuse any answer when nothing has been asked', () => {
        const { encounter } = createAskingEncounter();

        expect(encounter.answerPrompt('yes')).toBe(false);
        expect(encounter.answerPrompt(null)).toBe(false);
        expect(encounter.given).toEqual([]);
    });

    it('get their default answer when none is given', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.askSomething();

        expect(encounter.answerPrompt(null)).toBe(true);
        expect(encounter.given).toEqual(['no']);
        expect(state.prompt).toBeNull();
    });

    it('get their default answer once time runs out', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.askSomething('Well?', 15_000);

        state.currentTime += 15_000 - 1;
        encounter.update(0);
        expect(encounter.given).toEqual([]);

        state.currentTime += 1;
        encounter.update(0);
        expect(encounter.given).toEqual(['no']);
        expect(state.prompt).toBeNull();
    });

    it('are replaced by whatever is asked next, whose own answers are the ones then given', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.askSomething('First?', 20_000, ' to the first');
        encounter.askSomething('Second?', 20_000, ' to the second');

        expect(state.prompt).toMatchObject({ text: 'Second?' });
        expect(encounter.answerPrompt('yes')).toBe(true);
        expect(encounter.given).toEqual(['yes to the second']);
        expect(state.prompt).toBeNull();
    });

    it.each(['success', 'failure'] as const)('are dropped unanswered when the encounter ends in %s', (outcome) => {
        const { state, encounter } = createAskingEncounter();
        encounter.askSomething();

        encounter.finish(outcome);

        expect(state.prompt).toBeNull();
        expect(encounter.answerPrompt('yes')).toBe(false);
        expect(encounter.given).toEqual([]);
    });
});

import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { Encounter } from './Encounter';
import { getDefaultNode } from './EncounterRegistry';
import type { EncounterOutcome } from 'common-data/features/sectors/types/ObjectiveInfo';

const rooms = setupGameRoom();

const options = [{ id: 'yes', label: 'Agree' }, { id: 'no', label: 'Refuse' }];

/** An encounter that does nothing but ask what it's told to, and note the answers. */
class AskingEncounter extends Encounter {
    readonly answers: string[] = [];

    protected populate(): void {}

    ask(text = 'Well?', timeoutMs = 20_000): void {
        this.prompt('Someone', text, options, timeoutMs, 'no');
    }

    finish(outcome: EncounterOutcome): void {
        this.complete(outcome);
    }

    protected override onPromptAnswered(optionId: string): void {
        this.answers.push(optionId);
    }
}

function createAskingEncounter() {
    const state = rooms.createState(seededRandom(3));
    startCampaign(state);
    const encounter = new AskingEncounter(state, getDefaultNode('skirmish'));
    encounter.start();
    return { state, encounter };
}

describe('Encounter prompts', () => {
    it('ask the crew something, with the answers it could give and how long it has to give one', () => {
        const { state, encounter } = createAskingEncounter();
        expect(state.prompt).toBeNull();

        encounter.ask('Hand it over?', 15_000);

        expect(state.prompt).toMatchObject({ speaker: 'Someone', text: 'Hand it over?' });
        expect(state.prompt!.options.map(option => ({ id: option.id, label: option.label }))).toEqual(options);
        expect(state.prompt!.countdown).toMatchObject({ startTime: state.currentTime, endTime: state.currentTime + 15_000 });
    });

    it('take one of the answers on offer, once', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.ask();

        expect(encounter.answerPrompt('yes')).toBe(true);
        expect(encounter.answers).toEqual(['yes']);
        expect(state.prompt).toBeNull();

        // It's been answered, so there's nothing left to answer.
        expect(encounter.answerPrompt('no')).toBe(false);
        expect(encounter.answers).toEqual(['yes']);
    });

    it('refuse an answer that isn\'t on offer, and keep waiting', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.ask();

        expect(encounter.answerPrompt('maybe')).toBe(false);
        expect(encounter.answers).toEqual([]);
        expect(state.prompt).not.toBeNull();
    });

    it('refuse any answer when nothing has been asked', () => {
        const { encounter } = createAskingEncounter();

        expect(encounter.answerPrompt('yes')).toBe(false);
        expect(encounter.answerPrompt(null)).toBe(false);
        expect(encounter.answers).toEqual([]);
    });

    it('get their default answer when none is given', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.ask();

        expect(encounter.answerPrompt(null)).toBe(true);
        expect(encounter.answers).toEqual(['no']);
        expect(state.prompt).toBeNull();
    });

    it('are replaced by whatever is asked next, and then never answered', () => {
        const { state, encounter } = createAskingEncounter();
        encounter.ask('First?');
        encounter.ask('Second?');

        expect(state.prompt).toMatchObject({ text: 'Second?' });
        expect(encounter.answerPrompt('yes')).toBe(true);
        expect(encounter.answers).toEqual(['yes']);
        expect(state.prompt).toBeNull();
    });

    it.each(['success', 'failure'] as const)('are dropped unanswered when the encounter ends in %s', (outcome) => {
        const { state, encounter } = createAskingEncounter();
        encounter.ask();

        encounter.finish(outcome);

        expect(state.prompt).toBeNull();
        expect(encounter.answerPrompt('yes')).toBe(false);
        expect(encounter.answers).toEqual([]);
    });
});

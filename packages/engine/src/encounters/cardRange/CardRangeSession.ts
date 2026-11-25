import { cardRangeEncounterId, isCardRangePreset, isCardRangeStatus, type CardRangeCommand, type CardRangeInfo, type CardRangePreset } from 'common-data/features/cards/types/CardRangeInfo';
import { getCardRangeCardTypes, getCardRangeDefinition, getDefaultCardRangePreset } from './cardRangeCards';
import { CardRangeEncounter } from './CardRangeEncounter';
import type { CardRangeEntry, CardRangeProgress, CardRangeStore } from './cardRangeProgress';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { GameState } from 'src/state/GameState';

/**
 * Dev tools: goes through every card in turn on the card range (see `CardRangeEncounter`), loading it afresh for each,
 * and keeps how each one went, and the card last tried, in its store, so that testing can pick up where it left off in a later game.
 */
export class CardRangeSession {
    private readonly cardTypes = getCardRangeCardTypes();
    private readonly progress: CardRangeProgress;
    private index: number;

    constructor(private readonly state: GameState, private readonly store: CardRangeStore) {
        this.progress = store.load();
        this.index = Math.max(0, this.cardTypes.indexOf(this.progress.current as CardType));
    }

    get currentCard(): CardType {
        return this.cardTypes[this.index];
    }

    /** The card range encounter, if it's the one running. */
    private get encounter(): CardRangeEncounter | null {
        const encounter = this.state.campaign?.activeEncounter;
        return encounter instanceof CardRangeEncounter ? encounter : null;
    }

    /** Loads the card range for the given card, or if none is given, the one last tried. Returns whether it could. */
    start(cardType?: string): boolean {
        if (cardType !== undefined) {
            const index = this.cardTypes.indexOf(cardType as CardType);
            if (index === -1) {
                console.error(`[card range] Unknown card: ${cardType}`);
                return false;
            }
            this.index = index;
        }

        return this.setUp();
    }

    /** Does what the dev tools asked, returning whether it could. */
    handle(command: CardRangeCommand): boolean {
        switch (command.action) {
            case 'go':
                return typeof command.cardType === 'string' && this.start(command.cardType);
            case 'step': {
                const index = this.findStep(command.delta === -1 ? -1 : 1, command.untestedOnly === true);
                if (index === null) {
                    return false;
                }
                this.index = index;
                return this.setUp();
            }
            case 'replay': {
                const encounter = this.encounter;
                // After loading another encounter, the card range has to be set up again before there's anything to replay.
                if (!encounter || encounter.currentCard !== this.currentCard) {
                    return this.setUp();
                }
                encounter.replay();
                return true;
            }
            case 'reset':
                return this.setUp();
            case 'mark':
                if (command.status !== null && !isCardRangeStatus(command.status)) {
                    return false;
                }
                this.updateEntry({
                    status: command.status ?? undefined,
                    ...(typeof command.note === 'string' && { note: command.note.trim() || undefined }),
                });
                return true;
            case 'preset':
                if (!isCardRangePreset(command.preset)) {
                    return false;
                }
                this.updateEntry({ preset: command.preset === getDefaultCardRangePreset(this.currentCard) ? undefined : command.preset });
                return this.setUp();
            default:
                return false;
        }
    }

    getInfo(): CardRangeInfo {
        return {
            cards: this.cardTypes.map((type) => {
                const { status, note } = this.progress.cards[type] ?? {};
                return {
                    type,
                    system: getCardRangeDefinition(type).system,
                    preset: this.getPreset(type),
                    ...(status && { status }),
                    ...(note && { note }),
                };
            }),
            currentIndex: this.index,
            active: this.encounter !== null,
            progressFile: this.store.location,
        };
    }

    private getPreset(cardType: CardType): CardRangePreset {
        return this.progress.cards[cardType]?.preset ?? getDefaultCardRangePreset(cardType);
    }

    /** The index of the next (or previous) card, or of the next one without a status, wrapping around. Null if there's none. */
    private findStep(delta: 1 | -1, untestedOnly: boolean): number | null {
        const count = this.cardTypes.length;

        for (let step = 1; step <= count; step++) {
            const index = (this.index + delta * step + count * step) % count;
            if (!untestedOnly || !this.progress.cards[this.cardTypes[index]]?.status) {
                return index;
            }
        }

        return null;
    }

    /** Loads the card range afresh, for the current card. */
    private setUp(): boolean {
        const cardType = this.currentCard;
        this.progress.current = cardType;
        this.save();

        if (!this.state.campaign?.devLoadEncounter(cardRangeEncounterId)) {
            console.error(`[card range] Could not load the card range for ${cardType}`);
            return false;
        }

        this.encounter?.setUp(cardType, this.getPreset(cardType));
        return true;
    }

    /** Changes the current card's entry: a field given as undefined is cleared, and one left out is kept. */
    private updateEntry(changes: Partial<CardRangeEntry>): void {
        const merged: CardRangeEntry = { ...this.progress.cards[this.currentCard], ...changes };
        const entry = Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined)) as CardRangeEntry;

        if (Object.keys(entry).length > 0) {
            this.progress.cards[this.currentCard] = entry;
        } else {
            delete this.progress.cards[this.currentCard];
        }

        this.save();
    }

    /** Saves the progress, with the cards in the order they're tried, so that the file reads in that order too. */
    private save(): void {
        const cards: Record<string, CardRangeEntry> = {};
        for (const cardType of this.cardTypes) {
            const entry = this.progress.cards[cardType];
            if (entry) {
                cards[cardType] = entry;
            }
        }

        // Keep anything for cards that no longer exist, rather than lose it, after those that do.
        for (const [cardType, entry] of Object.entries(this.progress.cards)) {
            if (!(cardType in cards)) {
                cards[cardType] = entry;
            }
        }

        this.store.save({ current: this.progress.current, cards });
    }
}

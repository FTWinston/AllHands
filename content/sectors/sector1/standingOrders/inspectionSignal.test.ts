import { playerShipSetup } from 'engine/campaign/playerShipSetup';
import { seededRandom } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import { canBuildSignal, chooseSignal, defaultSignal, getKitCards, getSignalCardType, signalDeliveries, signalModifiers, signalSubstances, type InspectionSignal } from './inspectionSignal.engine';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';

const startingDeck = playerShipSetup.science.cards as CardType[];

const everySignal: InspectionSignal[] = signalModifiers.flatMap(modifier =>
    signalSubstances.flatMap(substance =>
        signalDeliveries.map(delivery => ({ modifier, substance, delivery }))));

const seeds = Array.from({ length: 50 }, (_, index) => index + 1);

describe('getSignalCardType', () => {
    it('is the deflector card that a deflector loaded that way plays as', () => {
        expect(getSignalCardType({ modifier: 'Inverted', substance: 'Tetryon', delivery: 'Pulse' })).toBe('deflectorInvertedTetryonPulse');
        expect(getSignalCardType(defaultSignal)).toBe('deflectorModulatedGravitonField');
    });
});

describe('canBuildSignal', () => {
    it('needs no cards for the defaults, which empty slots give', () => {
        expect(canBuildSignal(defaultSignal, [])).toBe(true);
    });

    it('needs a card for each part that isn\'t a default', () => {
        const signal: InspectionSignal = { modifier: 'Modulated', substance: 'Tetryon', delivery: 'Pulse' };

        expect(canBuildSignal(signal, ['tetryonScan'])).toBe(false);
        expect(canBuildSignal(signal, ['tetryonScan', 'invertedPulseScan'])).toBe(true);
    });

    it('can\'t use one card in two slots, even if it names both parts', () => {
        const signal: InspectionSignal = { modifier: 'Coherent', substance: 'Chroniton', delivery: 'Beam' };

        expect(canBuildSignal(signal, ['coherentChronitonScan'])).toBe(false);
        expect(canBuildSignal(signal, ['coherentChronitonScan', 'coherentChronitonScan'])).toBe(false);
        expect(canBuildSignal(signal, ['coherentChronitonScan', 'coherentChronitonScan', 'coherentChronitonScan'])).toBe(true);
    });

    it('finds a way to share the cards out, when the obvious one wouldn\'t work', () => {
        // The pulse scan has to give the delivery, which leaves the modifier to the antiproton one.
        const signal: InspectionSignal = { modifier: 'Inverted', substance: 'Graviton', delivery: 'Pulse' };

        expect(canBuildSignal(signal, ['invertedPulseScan', 'invertedAntiprotonScan'])).toBe(true);
        expect(canBuildSignal(signal, ['invertedAntiprotonScan', 'invertedPulseScan'])).toBe(true);
    });

    it('ignores cards that aren\'t scans', () => {
        expect(canBuildSignal({ modifier: 'Modulated', substance: 'Tetryon', delivery: 'Field' }, ['phaserCannon', 'passiveScan'])).toBe(false);
    });
});

describe('chooseSignal', () => {
    it.each(seeds)('seed %i picks one that the starting science deck can build, with a delivery and at least two parts to find', (seed) => {
        const signal = chooseSignal(seededRandom(seed), startingDeck);

        expect(canBuildSignal(signal, startingDeck)).toBe(true);
        expect(signal.delivery).not.toBe('Field');
        expect([signal.modifier !== 'Modulated', signal.substance !== 'Graviton', true].filter(Boolean).length).toBeGreaterThanOrEqual(2);
        expect(getKitCards(signal, startingDeck)).toEqual([]);
    });

    it('varies from one game to the next', () => {
        const signals = new Set(seeds.map(seed => getSignalCardType(chooseSignal(seededRandom(seed), startingDeck))));

        expect(signals.size).toBeGreaterThan(5);
    });

    it.each([
        ['nothing at all', []],
        ['no scans that load the deflector', ['passiveScan', 'passiveScan']],
        ['substances but no delivery', ['tetryonScan', 'polaronScan']],
    ] as [string, CardType[]][])('still picks one with a delivery for a deck with %s, which a kit then makes up for', (_description, deck) => {
        for (const seed of seeds) {
            const signal = chooseSignal(seededRandom(seed), deck);
            const kit = getKitCards(signal, deck);

            expect(signal.delivery).not.toBe('Field');
            expect(kit.length).toBeGreaterThan(0);
            expect(canBuildSignal(signal, [...deck, ...kit])).toBe(true);
        }
    });
});

describe('getKitCards', () => {
    it.each([
        ['an empty deck', []],
        ['the starting deck', startingDeck],
        ['a deck of one card that names three parts', ['coherentChronitonScan']],
    ] as [string, CardType[]][])('makes every signal buildable from %s, with no more cards than it has to', (_description, deck) => {
        for (const signal of everySignal) {
            const kit = getKitCards(signal, deck);

            expect(canBuildSignal(signal, [...deck, ...kit])).toBe(true);

            // Leaving any one of them out would leave the signal out of reach.
            for (let index = 0; index < kit.length; index++) {
                expect(canBuildSignal(signal, [...deck, ...kit.filter((_, other) => other !== index)])).toBe(false);
            }
        }
    });

    it('never needs two of the same card, as a kept card only comes back to a hand without another copy', () => {
        for (const signal of everySignal) {
            const kit = getKitCards(signal, []);

            expect(new Set(kit).size).toBe(kit.length);
        }
    });

    it('is only what the deck lacks', () => {
        const signal: InspectionSignal = { modifier: 'Inverted', substance: 'Tetryon', delivery: 'Beam' };

        expect(getKitCards(signal, ['tetryonScan', 'invertedPulseScan'])).toEqual(['coherentBeamScan']);
    });
});

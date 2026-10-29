import { describe, expect, it } from 'vitest';
import { deriveCardSynergy, findSynergyCardTypes, getSynergyCardTypes, type CardSynergy } from './cardSynergies';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';

const placeholderSynergies: Record<string, Required<CardSynergy>> = {
    laser: { provides: ['energyWeapon'], wants: [] },
    beam: { provides: ['energyWeapon'], wants: [] },
    torpedo: { provides: ['torpedoWeapon'], wants: [] },
    focusLens: { provides: [], wants: ['energyWeapon'] },
    warhead: { provides: [], wants: ['torpedoWeapon'] },
    freebie: { provides: ['zeroCost'], wants: [] },
    thrifty: { provides: ['energyWeapon'], wants: ['zeroCost'] },
    staple: { provides: [], wants: [] },
};

const pool = Object.keys(placeholderSynergies);

function find(spec: string) {
    return findSynergyCardTypes(spec, pool, type => placeholderSynergies[type]);
}

describe('findSynergyCardTypes', () => {
    it('finds cards that want what the spec provides', () => {
        expect(find('laser')).toEqual(['focusLens']);
        expect(find('torpedo')).toEqual(['warhead']);
    });

    it('finds cards that provide what the spec wants', () => {
        expect(find('focusLens')).toEqual(['laser', 'beam', 'thrifty']);
    });

    it('matches either way round on a card with both sides', () => {
        expect(find('thrifty')).toEqual(['focusLens', 'freebie']);
        expect(find('freebie')).toEqual(['thrifty']);
    });

    it('never matches the spec itself, or untagged cards', () => {
        expect(find('staple')).toEqual([]);
        expect(find('focusLens')).not.toContain('focusLens');
    });
});

describe('deriveCardSynergy', () => {
    it('tags weapon traits as provided, and a required weapon trait as wanted', () => {
        expect(deriveCardSynergy({ targetType: 'no-target', system: 'tactical', parameters: { cost: 2 }, traits: ['energyWeapon'] } as CardDefinition))
            .toEqual({ provides: ['energyWeapon'], wants: [] });

        expect(deriveCardSynergy({ targetType: 'weapon', system: 'tactical', parameters: { cost: 2 }, requiredWeaponTrait: 'torpedoWeapon' } as CardDefinition))
            .toEqual({ provides: [], wants: ['torpedoWeapon'] });
    });

    it('tags zero cost cards', () => {
        expect(deriveCardSynergy({ targetType: 'no-target', system: 'helm', parameters: { cost: 0 } } as CardDefinition))
            .toEqual({ provides: ['zeroCost'], wants: [] });
    });

    it('leaves other cards untagged', () => {
        expect(deriveCardSynergy({ targetType: 'no-target', system: 'helm', parameters: { cost: 1 }, traits: ['primary'] } as CardDefinition))
            .toEqual({ provides: [], wants: [] });
    });
});

describe('getSynergyCardTypes', () => {
    it('matches real weapons with the cards that modify them', () => {
        const matches = getSynergyCardTypes('photonTorpedo');
        expect(matches).toContain('highYield');
        expect(matches).not.toContain('highIntensity');
        expect(matches).not.toContain('photonTorpedo');

        expect(getSynergyCardTypes('highIntensity')).toContain('phaserCannon');
    });

    it('only offers cards that a shop could sell', () => {
        expect(getSynergyCardTypes('exampleNoTarget')).toEqual([]);
        expect(getSynergyCardTypes('warpAway')).toEqual([]);
    });
});

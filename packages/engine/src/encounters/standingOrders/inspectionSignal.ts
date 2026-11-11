import { cardDefinitions, type CardType, type EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { DeflectorEffectDelivery, DeflectorEffectModifier, DeflectorEffectSubstance, ScanTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type { IRandom } from 'common-data/types/IRandom';

/** What a deflector is loaded with: one thing in each of its three slots. An empty slot gives that slot's default. */
export interface InspectionSignal {
    modifier: DeflectorEffectModifier;
    substance: DeflectorEffectSubstance;
    delivery: DeflectorEffectDelivery;
}

type Slot = keyof InspectionSignal;
type Part = { slot: Slot; value: string };

/** What an empty slot gives, so no card is needed for it. */
export const defaultSignal: InspectionSignal = { modifier: 'Modulated', substance: 'Graviton', delivery: 'Field' };

export const signalModifiers: readonly DeflectorEffectModifier[] = ['Modulated', 'Phased', 'Coherent', 'Inverted'];
export const signalSubstances: readonly DeflectorEffectSubstance[] = ['Graviton', 'Antiproton', 'Tetryon', 'Chroniton', 'Polaron'];
/** Every delivery but the default: a signal always has one of these. */
export const signalDeliveries: readonly Exclude<DeflectorEffectDelivery, 'Field'>[] = ['Beam', 'Pulse', 'Burst'];

/** A scan card that provides each part, for making up what a science deck lacks. Each goes into one slot, so one that names two parts still only provides one. */
const kitCards: Record<Slot, Record<string, CardType>> = {
    modifier: { Phased: 'phasedBurstScan', Coherent: 'coherentBeamScan', Inverted: 'invertedPulseScan' },
    substance: { Antiproton: 'antiprotonScan', Tetryon: 'tetryonScan', Chroniton: 'chronitonScan', Polaron: 'polaronScan' },
    delivery: { Beam: 'coherentBeamScan', Pulse: 'invertedPulseScan', Burst: 'phasedBurstScan' },
};

/** The deflector card that a deflector loaded this way plays as. */
export function getSignalCardType(signal: InspectionSignal): EnemyTargetedCardType {
    return `deflector${signal.modifier}${signal.substance}${signal.delivery}`;
}

/** What the given card would provide in each deflector slot, if it's a scan card that provides anything. */
function getParts(cardType: CardType): Partial<Record<Slot, string>> {
    const definition = cardDefinitions[cardType] as ScanTargetCardDefinition;

    return definition.targetType === 'scan'
        ? { modifier: definition.deflectorModifier, substance: definition.deflectorSubstance, delivery: definition.deflectorDelivery }
        : {};
}

/** The parts of a signal that need a card, as an empty slot wouldn't give them. */
function getNeededParts(signal: InspectionSignal): Part[] {
    return (['modifier', 'substance', 'delivery'] as const)
        .filter(slot => signal[slot] !== defaultSignal[slot])
        .map(slot => ({ slot, value: signal[slot] }));
}

/** Whether these cards could provide all of these parts at once. A card only goes into one slot, so each part needs a card of its own. */
function canProvide(parts: readonly Part[], cards: readonly CardType[], used: ReadonlySet<number> = new Set()): boolean {
    if (parts.length === 0) {
        return true;
    }

    const [part, ...rest] = parts;

    return cards.some((card, index) => !used.has(index)
        && getParts(card)[part.slot] === part.value
        && canProvide(rest, cards, new Set([...used, index])));
}

/** Whether a deflector could be loaded with this signal, using only these cards. */
export function canBuildSignal(signal: InspectionSignal, cards: readonly CardType[]): boolean {
    return canProvide(getNeededParts(signal), cards);
}

/**
 * Picks a signal for a customs platform to be keyed to, for a crew whose science deck holds these cards.
 * It's one that those cards can build, if any can be that takes at least two of them and has a delivery.
 * Otherwise it's a simple one that they can't build unaided: see `getKitCards` for what they'd then be missing.
 */
export function chooseSignal(random: IRandom, cards: readonly CardType[]): InspectionSignal {
    const buildable: InspectionSignal[] = [];

    for (const modifier of signalModifiers) {
        for (const substance of signalSubstances) {
            for (const delivery of signalDeliveries) {
                const signal = { modifier, substance, delivery };

                if (getNeededParts(signal).length >= 2 && canBuildSignal(signal, cards)) {
                    buildable.push(signal);
                }
            }
        }
    }

    return buildable.length > 0
        ? random.pick(buildable)
        : { modifier: defaultSignal.modifier, substance: random.pick(signalSubstances.slice(1)), delivery: random.pick(signalDeliveries) };
}

/**
 * The extra scan cards that a crew would need to be given to build this signal, on top of these cards of their own.
 * It's as few as possible, and none at all for a signal that `canBuildSignal` with those cards.
 */
export function getKitCards(signal: InspectionSignal, cards: readonly CardType[]): CardType[] {
    const needed = getNeededParts(signal);
    let missing = needed;

    // Try leaving out each combination of parts, and keep the smallest that lets their own cards provide the rest.
    for (let mask = 0; mask < 1 << needed.length; mask++) {
        const left = needed.filter((_, index) => mask & (1 << index));

        if (left.length < missing.length && canProvide(needed.filter(part => !left.includes(part)), cards)) {
            missing = left;
        }
    }

    return missing.map(part => kitCards[part.slot][part.value]);
}

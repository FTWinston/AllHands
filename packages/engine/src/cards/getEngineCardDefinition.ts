import type {
    EngineCardDefinition,
    EngineCardFunctionality,
    EngineEnemyTargetCardDefinition,
    EngineLocationTargetCardDefinition,
    EngineNoTargetCardDefinition,
    EngineScanTargetCardDefinition,
    EngineSystemTargetCardDefinition,
    EngineWeaponSlotCardDefinition,
    EngineWeaponTargetCardDefinition,
} from './EngineCardDefinition';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type {
    CardType,
    EnemyTargetedCardType,
    LocationTargetedCardType,
    ScanTargetedCardType,
    SystemSlotTargetedCardType,
    UntargetedCardType,
    WeaponSlotTargetedCardType,
    WeaponTargetedCardType,
} from 'common-data/features/cards/utils/cardDefinitions';

/** Every registered card, with what it does. Filled by `registerEngineContent`. */
const engineCardDefinitions = new Map<string, EngineCardDefinition>();

/** Register the given cards, with what each one does. */
export function registerCards(cards: Readonly<Record<string, CardDefinition<string>>>, functionality: Readonly<Record<string, EngineCardFunctionality | undefined>>) {
    for (const [type, definition] of Object.entries(cards)) {
        if (engineCardDefinitions.has(type)) {
            throw new Error(`Card registered twice: ${type}`);
        }
        engineCardDefinitions.set(type, { ...definition, ...functionality[type] } as EngineCardDefinition);
    }
}

export function getCardDefinition(type: WeaponSlotTargetedCardType): EngineWeaponSlotCardDefinition;
export function getCardDefinition(type: WeaponTargetedCardType): EngineWeaponTargetCardDefinition;
export function getCardDefinition(type: LocationTargetedCardType): EngineLocationTargetCardDefinition;
export function getCardDefinition(type: SystemSlotTargetedCardType): EngineSystemTargetCardDefinition;
export function getCardDefinition(type: EnemyTargetedCardType): EngineEnemyTargetCardDefinition;
export function getCardDefinition(type: ScanTargetedCardType): EngineScanTargetCardDefinition;
export function getCardDefinition(type: UntargetedCardType): EngineNoTargetCardDefinition;
export function getCardDefinition(type: CardType): EngineCardDefinition;
export function getCardDefinition(type: CardType): EngineCardDefinition {
    const cardDef = engineCardDefinitions.get(type);

    if (!cardDef) {
        throw new Error(`Card definition not found: ${type}`);
    }

    return cardDef;
};

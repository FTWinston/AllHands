import { CardType, EnemyTargetedCardType, LocationTargetedCardType, SystemSlotTargetedCardType, UntargetedCardType, WeaponSlotTargetedCardType, WeaponTargetedCardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { NoTargetCardFunctionality, WeaponSlotTargetCardFunctionality, WeaponTargetCardFunctionality, EnemyTargetCardFunctionality, SystemTargetCardFunctionality, LocationTargetCardFunctionality, EngineCardDefinition, EngineCardFunctionality } from './EngineCardDefinition';

type CardFunctionalityLookup = Record<UntargetedCardType, NoTargetCardFunctionality>
    & Record<WeaponSlotTargetedCardType, WeaponSlotTargetCardFunctionality>
    & Record<WeaponTargetedCardType, WeaponTargetCardFunctionality>
    & Record<SystemSlotTargetedCardType, SystemTargetCardFunctionality>
    & Record<EnemyTargetedCardType, EnemyTargetCardFunctionality>
    & Record<LocationTargetedCardType, LocationTargetCardFunctionality>;

function loadCardDefinitions() {
    const cardFunctionalities: CardFunctionalityLookup = {
        flare: {
            play: () => {
                console.log('played flare'); return true;
            },
        },
        smokeScreen: {
            play: () => {
                console.log('played smokeScreen'); return true;
            },
        },
        phaserCannon: {
            play: (_slot) => {
                console.log('played phaserCannon'); return true;
            },
        },
        phaserStrip: {
            play: (_slot) => {
                console.log('played phaserStrip'); return true;
            },
        },
        photonTorpedo: {
            play: (_slot) => {
                console.log('played photonTorpedo'); return true;
            },
        },
        photonicCannon: {
            play: (_slot) => {
                console.log('played photonicCannon'); return true;
            },
        },

        exampleWeaponTarget: {
            play: (_weapon) => {
                console.log('played exampleWeaponTarget'); return true;
            },
        },
        exampleWeaponSlotTarget: {
            play: (_slot) => {
                console.log('played exampleWeaponSlotTarget'); return true;
            },
        },
        exampleEnemyTarget: {
            play: (_targetId) => {
                console.log('played exampleEnemyTarget'); return true;
            },
        },
        exampleSystemTarget: {
            play: (_system) => {
                console.log('played exampleSystemTarget'); return true;
            },
        },
        exampleLocationTarget: {
            play: (_locations) => {
                console.log('played exampleLocationTarget'); return true;
            },
        },
        exampleNoTarget: {
            play: () => {
                console.log('played exampleNoTarget'); return true;
            },
        },
    };

    const engineCardDefinitions = Object.entries(cardFunctionalities as Record<CardType, EngineCardFunctionality>)
        .reduce((acc, [type, desc]) => {
            acc[type as CardType] = { ...cardDefinitions[type as CardType], ...desc } as EngineCardDefinition;
            return acc;
        }, {} as Record<CardType, EngineCardDefinition>);
    return engineCardDefinitions;
}

const engineCardDefinitions = loadCardDefinitions();

export const getCardDefinition = (type: CardType): EngineCardDefinition => {
    const cardDef = engineCardDefinitions[type];

    if (!cardDef) {
        throw new Error(`Card definition not found: ${type}`);
    }

    return cardDef;
};

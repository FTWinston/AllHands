import {
    CardType,
    EnemyTargetedCardType,
    LocationTargetedCardType,
    SystemSlotTargetedCardType,
    UntargetedCardType,
    WeaponSlotTargetedCardType,
    WeaponTargetedCardType,
    cardDefinitions,
} from 'common-data/features/cards/utils/cardDefinitions';
import { applyMotionCard } from './applyMotionCard';
import {
    NoTargetCardFunctionality,
    WeaponSlotTargetCardFunctionality,
    WeaponTargetCardFunctionality,
    EnemyTargetCardFunctionality,
    SystemTargetCardFunctionality,
    LocationTargetCardFunctionality,
    EngineCardDefinition,
    EngineCardFunctionality,
} from './EngineCardDefinition';

type CardFunctionalityLookup = Record<UntargetedCardType, NoTargetCardFunctionality>
    & Record<WeaponSlotTargetedCardType, WeaponSlotTargetCardFunctionality>
    & Record<WeaponTargetedCardType, WeaponTargetCardFunctionality>
    & Record<SystemSlotTargetedCardType, SystemTargetCardFunctionality>
    & Record<EnemyTargetedCardType, EnemyTargetCardFunctionality>
    & Record<LocationTargetedCardType, LocationTargetCardFunctionality>;

function loadCardDefinitions() {
    const cardFunctionalities: CardFunctionalityLookup = {
        flare: {
            play: (_ship) => {
                console.log('played flare'); return true;
            },
        },
        smokeScreen: {
            play: (_ship) => {
                console.log('played smokeScreen'); return true;
            },
        },
        phaserCannon: {
            play: (_gameState, _ship, _slot) => {
                console.log('played phaserCannon'); return true;
            },
        },
        phaserStrip: {
            play: (_gameState, _ship, _slot) => {
                console.log('played phaserStrip'); return true;
            },
        },
        photonTorpedo: {
            play: (_gameState, _ship, _slot) => {
                console.log('played photonTorpedo'); return true;
            },
        },
        photonicCannon: {
            play: (_gameState, _ship, _slot) => {
                console.log('played photonicCannon'); return true;
            },
        },

        exampleWeaponTarget: {
            play: (_gameState, _ship, _weapon) => {
                console.log('played exampleWeaponTarget'); return true;
            },
        },
        exampleWeaponSlotTarget: {
            play: (_gameState, _ship, _slot) => {
                console.log('played exampleWeaponSlotTarget'); return true;
            },
        },
        exampleEnemyTarget: {
            play: (_gameState, _ship, _targetId) => {
                console.log('played exampleEnemyTarget'); return true;
            },
        },
        slowAndSteady: {
            play: applyMotionCard,
        },
        fullReverse: {
            play: applyMotionCard,
        },
        zigZag: {
            play: applyMotionCard,
        },
        strafe: {
            play: applyMotionCard,
        },
        sweepLeft: {
            play: applyMotionCard,
        },
        sweepRight: {
            play: applyMotionCard,
        },
        faceTarget: {
            play: applyMotionCard,
        },
        exampleNoTarget: {
            play: (_gameState, _ship) => {
                console.log('played exampleNoTarget'); return true;
            },
        },
        auxPower: {
            play: (_gameState, _ship, system) => {
                return system.addEffect('auxPower', 30);
            },
        },
    };

    const engineCardDefinitions = Object.entries(cardDefinitions)
        .reduce((acc, [type, def]) => {
            const functionality = (cardFunctionalities as Record<CardType, EngineCardFunctionality>)[type as CardType];
            acc[type as CardType] = { ...def, ...functionality } as EngineCardDefinition;
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

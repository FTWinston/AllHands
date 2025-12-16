import { CardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { CardFunctionality, EngineCardDefinition } from './EngineCardDefinition';

function loadCardDefinitions() {
    const cardFunctionalities: Record<CardType, CardFunctionality> = {
        flare: {
            play: () => console.log('played flare'),
        },
        smokeScreen: {
            play: () => console.log('played smokeScreen'),
        },
        phaserCannon: {
            play: () => console.log('played phaserCannon'),
        },
        phaserStrip: {
            play: () => console.log('played phaserStrip'),
        },
        photonTorpedo: {
            play: () => console.log('played photonTorpedo'),
        },
        photonicCannon: {
            play: () => console.log('played photonicCannon'),
        },

        exampleWeaponTarget: {
            play: () => console.log('played exampleWeaponTarget'),
        },
        exampleWeaponSlotTarget: {
            play: () => console.log('played exampleWeaponSlotTarget'),
        },
        exampleEnemyTarget: {
            play: () => console.log('played exampleEnemyTarget'),
        },
        exampleSystemTarget: {
            play: () => console.log('played exampleSystemTarget'),
        },
        exampleLocationTarget: {
            play: () => console.log('played exampleLocationTarget'),
        },
        exampleNoTarget: {
            play: () => console.log('played exampleNoTarget'),
        },
    };

    const engineCardDefinitions = Object.entries(cardFunctionalities)
        .reduce((acc, [type, desc]) => {
            acc[type as CardType] = { ...cardDefinitions[type as CardType], ...desc };
            return acc;
        }, {} as Record<CardType, EngineCardDefinition>);
    return engineCardDefinitions;
}

const engineCardDefinitions = loadCardDefinitions();

export const getCardDefinition = (type: CardType): EngineCardDefinition => {
    const cardDef: EngineCardDefinition = engineCardDefinitions[type];

    if (!cardDef) {
        throw new Error(`Card definition not found: ${type}`);
    }

    return cardDef;
};

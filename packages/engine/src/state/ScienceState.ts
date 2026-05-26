import { type } from '@colyseus/schema';
import { DeflectorEffectDelivery, DeflectorEffectModifier, DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { resolveParameters } from 'common-data/features/cards/utils/resolveParameters';
import { CrewSystemSetupInfo, ScienceSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition, EngineDeflectorTargetCardDefinition, EngineEnemyTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from '../cards/getEngineCardDefinition';
import { CardState } from './CardState';
import { CrewSystemState } from './CrewSystemState';
import { GameState } from './GameState';
import { Ship } from './Ship';

export class ScienceState extends CrewSystemState implements ScienceSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
        this.deflectorCardId = getCardId();
    }

    private readonly deflectorCardId: number;

    @type(CardState) modifierSlotCard: CardState | null = null;
    @type(CardState) substanceSlotCard: CardState | null = null;
    @type(CardState) deliverySlotCard: CardState | null = null;

    @type(CardState) deflectorCard: CardState | null = null;

    override playCard(cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string): EngineCardDefinition | null {
        // If the deflector card is being played against an enemy, handle it separately, as it's not in the hand.
        if (targetType === 'enemy' && cardId === this.deflectorCardId && this.deflectorCard !== null) {
            return this.playDeflectorCard(targetId);
        }

        return super.playCard(cardId, cardType, targetType, targetId);
    }

    private playDeflectorCard(targetId: string): EngineCardDefinition | null {
        if (!this.deflectorCard) {
            return null;
        }

        const cardDefinition = getCardDefinition(this.deflectorCard.type) as EngineEnemyTargetCardDefinition;
        const parameters = resolveParameters(cardDefinition.parameters, this.deflectorCard.modifiers);
        const resolvedCost = parameters['cost'];

        if (this.powerLevel < resolvedCost) {
            console.warn('insufficient power to play deflector card');
            return null;
        }

        const target = this.resolveTarget(targetId);
        if (!target) {
            console.warn('target not found: ' + targetId);
            return null;
        }

        if (!cardDefinition.play(this.getGameState(), this.getShip(), target, parameters)) {
            console.log('deflector card refused to play');
            return null;
        }

        // The main deflector card has been played, and should be expended.
        this.handlePlayedCard(this.deflectorCard, -1, cardDefinition, false);
        this.deflectorCard = null;

        // Cards in deflector slots should be discarded when the deflector is activated.
        if (this.modifierSlotCard) {
            this.handlePlayedCard(this.modifierSlotCard, -1, cardDefinition, false);
            this.modifierSlotCard = null;
        }
        if (this.substanceSlotCard) {
            this.handlePlayedCard(this.substanceSlotCard, -1, cardDefinition, false);
            this.substanceSlotCard = null;
        }
        if (this.deliverySlotCard) {
            this.handlePlayedCard(this.deliverySlotCard, -1, cardDefinition, false);
            this.deliverySlotCard = null;
        }

        return cardDefinition;
    }

    override playCardIntoDeflectorSlot(card: CardState, cardDefinition: EngineDeflectorTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
        if (cardDefinition.parameters[targetId] === null) {
            console.log(`card cannot be played into the ${targetId} slot`);
            return false;
        }

        type ScienceSlotField = 'modifierSlotCard' | 'substanceSlotCard' | 'deliverySlotCard';
        let slot: ScienceSlotField;

        switch (targetId) {
            case 'modifier':
                slot = 'modifierSlotCard';
                break;
            case 'substance':
                slot = 'substanceSlotCard';
                break;
            case 'delivery':
                slot = 'deliverySlotCard';
                break;
            default:
                console.warn('unknown science slot: ' + targetId);
                return false;
        }

        if (!cardDefinition.load(this.getGameState(), this.getShip(), targetId, parameters)) {
            console.log('card refused to load');
            return false;
        }

        const previousCard = this[slot];
        if (previousCard) {
            // Return the displaced card to the hand.
            this.hand.push(previousCard);
        }

        this[slot] = card;
        this.updateDeflectorCard();
        return true;
    }

    private updateDeflectorCard(): void {
        const modifier = this.modifierSlotCard
            ? (getCardDefinition(this.modifierSlotCard.type) as EngineDeflectorTargetCardDefinition).parameters.modifier
            : null;

        const substance = this.substanceSlotCard
            ? (getCardDefinition(this.substanceSlotCard.type) as EngineDeflectorTargetCardDefinition).parameters.substance
            : null;

        const delivery = this.deliverySlotCard
            ? (getCardDefinition(this.deliverySlotCard.type) as EngineDeflectorTargetCardDefinition).parameters.delivery
            : null;

        const cardType = this.determineDeflectorCardType(modifier, substance, delivery);
        this.deflectorCard = cardType !== null ? new CardState(this.deflectorCardId, cardType) : null;
    }

    determineDeflectorCardType(
        modifier: DeflectorEffectModifier | null,
        substance: DeflectorEffectSubstance | null,
        delivery: DeflectorEffectDelivery | null
    ): EnemyTargetedCardType | null {
        if (!modifier && !substance && !delivery) {
            return null;
        }

        if (!modifier) {
            modifier = 'Modulated';
        }

        if (!substance) {
            substance = 'Antiproton';
        }

        if (!delivery) {
            delivery = 'Wave';
        }

        // TODO: implement all the card types so this can be used
        // return `deflector${modifier}${substance}${delivery}`;

        return 'exampleEnemyTarget';
    }
}

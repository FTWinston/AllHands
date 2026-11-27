import { ArraySchema, Schema, type } from '@colyseus/schema';
import { CardState } from './CardState';
import type { OutfitBundleInfo, RoleCardInfo, SalvageCardInfo } from 'common-data/features/cards/types/CardRewardInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

/** A card for one crew member's deck, offered to the crew as a whole. */
export class RoleCardState extends Schema implements RoleCardInfo {
    constructor(role: CrewRoleName, card: CardState) {
        super();
        this.role = role;
        this.card = card;
    }

    @type('string') readonly role: CrewRoleName;
    @type(CardState) readonly card: CardState;
}

/** One of the cards salvaged after a fight, with its crew member's deck size and cap when it was offered. */
export class SalvageCardState extends RoleCardState implements SalvageCardInfo {
    constructor(role: CrewRoleName, card: CardState, deckSize: number, maxDeckSize: number) {
        super(role, card);
        this.deckSize = deckSize;
        this.maxDeckSize = maxDeckSize;
    }

    @type('uint8') readonly deckSize: number;
    @type('uint8') readonly maxDeckSize: number;
}

/** A bundle offered at an outfitting station: a card for each crew member, one of which (the standout) is better than the rest. */
export class OutfitBundleState extends Schema implements OutfitBundleInfo {
    constructor(standout: CrewRoleName, cards: readonly RoleCardState[]) {
        super();
        this.standout = standout;
        this.cards = new ArraySchema<RoleCardState>(...cards);
    }

    @type('string') readonly standout: CrewRoleName;
    @type([RoleCardState]) readonly cards: ArraySchema<RoleCardState>;
}

import type { CardDescription } from '../features/cards/types/UICardDefinition';
import type { SystemEffectDescription } from '../types/UISystemEffectDefinition';
import type { AnySharedContent } from 'common-data/content/SharedContent';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';

/**
 * What a content folder adds to the clients: what its shared cards and status effects are called, and how they're described and drawn.
 * Every one is listed in `content/content.ui.ts`, which each client registers when it starts (see `registerUiContent`).
 */
export interface UiContent {
    readonly side: 'ui';
    /** The folder's shared content, whose cards and effects this describes. */
    readonly shared: AnySharedContent;
    readonly cards: Readonly<Record<string, CardDescription>>;
    readonly effects: Readonly<Record<string, SystemEffectDescription>>;
}

/** What each of the given cards is called, and how it's described and drawn, keyed by card type. */
export type UiCards<TCards> = { [K in keyof TCards]: CardDescription };

/** What each of the given status effects is called, and how it's described and drawn, keyed by effect type. */
export type UiEffects<TEffects> = { [K in keyof TEffects]: SystemEffectDescription };

/** How each of a content folder's cards looks, checked against those cards' shared definitions (its `cards/*.shared.ts`): every card must be covered. */
export function defineUiCards<TCards extends Readonly<Record<string, CardDefinition<string>>>>(_shared: TCards, cards: NoInfer<UiCards<TCards>>): UiCards<TCards> {
    return cards;
}

/** How each of a content folder's status effects looks, checked against those effects' shared definitions (its `effects/*.shared.ts`): every effect must be covered. */
export function defineUiEffects<TEffects extends Readonly<Record<string, SystemEffectDefinition>>>(_shared: TEffects, effects: NoInfer<UiEffects<TEffects>>): UiEffects<TEffects> {
    return effects;
}

/** A description of every card and effect in the shared content: required where it has any. */
type Descriptions<TShared extends AnySharedContent>
    = (keyof TShared['cards'] extends never ? { cards?: UiCards<TShared['cards']> } : { cards: UiCards<TShared['cards']> })
        & (keyof TShared['effects'] extends never ? { effects?: UiEffects<TShared['effects']> } : { effects: UiEffects<TShared['effects']> });

export function defineUiContent<TShared extends AnySharedContent>(content: { shared: TShared } & Descriptions<TShared>): UiContent {
    return {
        side: 'ui',
        shared: content.shared,
        cards: content.cards ?? {},
        effects: content.effects ?? {},
    };
}

import type { CardDescription } from '../features/cards/types/UICardDefinition';
import type { SystemEffectDescription } from '../types/UISystemEffectDefinition';
import type { AnySharedContent } from 'common-data/content/SharedContent';

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

/** A description of every card and effect in the shared content: required where it has any. */
type Descriptions<TShared extends AnySharedContent>
    = (keyof TShared['cards'] extends never ? { cards?: undefined } : { cards: { [K in keyof TShared['cards']]: CardDescription } })
        & (keyof TShared['effects'] extends never ? { effects?: undefined } : { effects: { [K in keyof TShared['effects']]: SystemEffectDescription } });

export function defineUiContent<TShared extends AnySharedContent>(content: { shared: TShared } & Descriptions<TShared>): UiContent {
    return {
        side: 'ui',
        shared: content.shared,
        cards: content.cards ?? {},
        effects: content.effects ?? {},
    };
}

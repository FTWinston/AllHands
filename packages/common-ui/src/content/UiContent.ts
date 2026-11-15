import type { CardDescription } from '../features/cards/types/UICardDefinition';
import type { ShipDrawing, SvgComponent } from '../objects/shipDrawings';
import type { SystemEffectDescription } from '../types/UISystemEffectDefinition';
import type { AnySharedContent } from 'common-data/content/SharedContent';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import type { AppearanceDefinition } from 'common-data/features/space/types/AppearanceDefinition';

/**
 * What a content folder adds to the clients: what its shared cards and status effects are called, how they're described and drawn, and its ship drawings.
 * Every one is listed in `content/content.ui.ts`, which each client registers when it starts (see `registerUiContent`).
 */
export interface UiContent {
    readonly side: 'ui';
    /** The folder's shared content, whose cards and effects this describes. */
    readonly shared: AnySharedContent;
    readonly cards: Readonly<Record<string, CardDescription>>;
    readonly effects: Readonly<Record<string, SystemEffectDescription>>;
    readonly drawings: Readonly<Record<string, ShipDrawing>>;
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

/** How each of the given ship appearances is drawn, keyed by appearance. */
export type UiDrawings<TAppearances> = { [K in keyof TAppearances]: ShipDrawing };

/**
 * A content folder's ship drawings (its `ships/*.ui.tsx`), checked against its shared appearances (its `ships/*.shared.ts`).
 * The svgs come from globbing the folder: `import.meta.glob('./*.svg', ...)`, once as components and once as text. Each appearance needs an svg of the same name,
 * and each svg an appearance, or this throws as the folder is loaded (which every client, and `content/registration.test.tsx`, does).
 * The shield outlines are generated beside them (see `shieldOutlines.test.ts`), and must cover every appearance.
 */
export function defineUiShips<TAppearances extends Readonly<Record<string, AppearanceDefinition>>>(
    shared: TAppearances,
    files: {
        icons: Readonly<Record<string, SvgComponent>>;
        svgs: Readonly<Record<string, string>>;
        shieldOutlines: NoInfer<Readonly<Record<keyof TAppearances, string>>>;
    }
): UiDrawings<TAppearances> {
    const appearanceOf = (path: string) => path.replace(/^.*\/(.+)\.svg$/, '$1');
    const icons = Object.fromEntries(Object.entries(files.icons).map(([path, icon]) => [appearanceOf(path), icon]));
    const svgs = Object.fromEntries(Object.entries(files.svgs).map(([path, svg]) => [appearanceOf(path), svg]));

    for (const appearance of Object.keys(svgs)) {
        if (!(appearance in shared)) {
            throw new Error(`Ship drawing ${appearance}.svg has no appearance defined for it`);
        }
    }

    return Object.fromEntries(Object.keys(shared).map((appearance) => {
        const Icon = icons[appearance];
        const svg = svgs[appearance];
        if (!Icon || !svg) {
            throw new Error(`Appearance ${appearance} has no drawing: add ${appearance}.svg beside its definition`);
        }
        return [appearance, { Icon, svg, shieldOutline: files.shieldOutlines[appearance as keyof TAppearances] }];
    })) as UiDrawings<TAppearances>;
}

/** A description of every card and effect in the shared content, and a drawing for each appearance: required where it has any. */
type Descriptions<TShared extends AnySharedContent>
    = (keyof TShared['cards'] extends never ? { cards?: UiCards<TShared['cards']> } : { cards: UiCards<TShared['cards']> })
        & (keyof TShared['effects'] extends never ? { effects?: UiEffects<TShared['effects']> } : { effects: UiEffects<TShared['effects']> })
        & (keyof TShared['appearances'] extends never ? { drawings?: UiDrawings<TShared['appearances']> } : { drawings: UiDrawings<TShared['appearances']> });

export function defineUiContent<TShared extends AnySharedContent>(content: { shared: TShared } & Descriptions<TShared>): UiContent {
    return {
        side: 'ui',
        shared: content.shared,
        cards: content.cards ?? {},
        effects: content.effects ?? {},
        drawings: content.drawings ?? {},
    };
}

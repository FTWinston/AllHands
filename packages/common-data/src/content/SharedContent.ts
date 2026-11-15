import type { CardDefinition } from 'src/features/cards/types/CardDefinition';
import type { SystemEffectDefinition } from 'src/features/ships/types/SystemEffectDefinition';
import type { AppearanceDefinition } from 'src/features/space/types/AppearanceDefinition';

/** Card definitions keyed by card type. A choice card's options are other cards in the same object. */
export type CardDefinitions<TKey extends string = string> = { [K in TKey]: CardDefinition<TKey> };

/** Status effect definitions keyed by effect type. */
export type SystemEffectDefinitions = Record<string, SystemEffectDefinition>;

/** Ship drawings keyed by appearance, which is also the name of each one's svg. */
export type AppearanceDefinitions = Record<string, AppearanceDefinition>;

/**
 * What a content folder adds that the engine and the clients both need to know about: the cards, status effects and ship drawings (appearances) it defines.
 * The folder's `*.engine.ts` and `*.ui.tsx` registrations each name this one as their `shared` content, and give how its cards and effects behave and look.
 * Every one is listed in `content/content.shared.ts`.
 */
export interface SharedContent<
    TCards extends CardDefinitions<Extract<keyof TCards, string>> = CardDefinitions<never>,
    TEffects extends SystemEffectDefinitions = Record<never, SystemEffectDefinition>,
    TAppearances extends AppearanceDefinitions = Record<never, AppearanceDefinition>
> {
    readonly side: 'shared';
    readonly cards: TCards;
    readonly effects: TEffects;
    readonly appearances: TAppearances;
}

/** Keeps each card's literal types (its target type, above all), which `CardType` and the targeted card type unions are worked out from. */
export function defineCards<const TCards extends CardDefinitions<Extract<keyof TCards, string>>>(cards: TCards): TCards {
    return cards;
}

/** Keeps each effect's literal types (whether it uses levels, above all), which `LeveledSystemEffectType` is worked out from. */
export function defineEffects<const TEffects extends SystemEffectDefinitions>(effects: TEffects): TEffects {
    return effects;
}

/** Keeps each appearance's name, which `ShipAppearance` is worked out from. A folder's `ships/*.shared.ts` defines its own, each with an svg of the same name beside it. */
export function defineAppearances<const TAppearances extends AppearanceDefinitions>(appearances: TAppearances): TAppearances {
    return appearances;
}

export function defineSharedContent<
    TCards extends CardDefinitions<Extract<keyof TCards, string>> = CardDefinitions<never>,
    TEffects extends SystemEffectDefinitions = Record<never, SystemEffectDefinition>,
    TAppearances extends AppearanceDefinitions = Record<never, AppearanceDefinition>
>(content: { cards?: TCards; effects?: TEffects; appearances?: TAppearances }): SharedContent<TCards, TEffects, TAppearances> {
    return {
        side: 'shared',
        cards: content.cards ?? {} as TCards,
        effects: content.effects ?? {} as TEffects,
        appearances: content.appearances ?? {} as TAppearances,
    };
}

/** Any piece of shared content, whatever it defines. */
export interface AnySharedContent {
    readonly side: 'shared';
    readonly cards: Readonly<Record<string, CardDefinition<string>>>;
    readonly effects: SystemEffectDefinitions;
    readonly appearances: AppearanceDefinitions;
}

type UnionToIntersection<U> = (U extends unknown ? (union: U) => void : never) extends (intersection: infer I) => void ? I : never;

/** Every card in the given shared content, together. */
export type MergedCards<TContent extends AnySharedContent> = UnionToIntersection<TContent['cards']>;

/** Every status effect in the given shared content, together. */
export type MergedEffects<TContent extends AnySharedContent> = UnionToIntersection<TContent['effects']>;

/** Every ship drawing in the given shared content, together. */
export type MergedAppearances<TContent extends AnySharedContent> = UnionToIntersection<TContent['appearances']>;

const kindNames = { cards: 'card', effects: 'status effect', appearances: 'appearance' } as const;

/** Put together one kind of definition from every piece of shared content, throwing if two define the same one. */
export function mergeSharedContent<TKind extends 'cards' | 'effects' | 'appearances'>(contents: readonly AnySharedContent[], kind: TKind) {
    const merged: Record<string, unknown> = {};

    for (const content of contents) {
        for (const [key, definition] of Object.entries(content[kind])) {
            if (key in merged) {
                throw new Error(`Two pieces of content define the same ${kindNames[kind]}: ${key}`);
            }
            merged[key] = definition;
        }
    }

    return merged;
}

import type { AnySharedContent } from 'common-data/content/SharedContent';
import type { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import type { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import type { SectorTheme } from 'src/campaign/sectorThemes';
import type { DesignTemplate } from 'src/campaign/shipDesigns';
import type {
    ChoiceTargetCardFunctionality,
    EnemyTargetCardFunctionality,
    EngineCardFunctionality,
    LocationTargetCardFunctionality,
    NoTargetCardFunctionality,
    ScanTargetCardFunctionality,
    ShipTargetCardFunctionality,
    SystemTargetCardFunctionality,
    WeaponSlotTargetCardFunctionality,
    WeaponTargetCardFunctionality,
} from 'src/cards/EngineCardDefinition';
import type { SystemEffectFunctionality } from 'src/effects/EngineSystemEffectDefinition';
import type { EncounterDefinition } from 'src/encounters/EncounterDefinition';

type FunctionalityFor<TTargetType extends CardTargetType>
    = TTargetType extends 'no-target' ? NoTargetCardFunctionality
        : TTargetType extends 'weapon-slot' ? WeaponSlotTargetCardFunctionality
            : TTargetType extends 'weapon' ? WeaponTargetCardFunctionality
                : TTargetType extends 'system' ? SystemTargetCardFunctionality
                    : TTargetType extends 'enemy' ? EnemyTargetCardFunctionality
                        : TTargetType extends 'scan' ? ScanTargetCardFunctionality
                            : TTargetType extends 'location' ? LocationTargetCardFunctionality
                                : TTargetType extends 'ship' ? ShipTargetCardFunctionality
                                    : never;

type CardsLike = Readonly<Record<string, { targetType: CardTargetType }>>;

type ChoiceKeys<TCards extends CardsLike> = { [K in keyof TCards]: TCards[K]['targetType'] extends 'choice' ? K : never }[keyof TCards];

/**
 * What each of the given cards does when it's played (and drawn, damaged and repaired), keyed by card type.
 * Choice cards have no play functionality of their own: they resolve to one of their options when played (see `CrewSystemState.playCard`),
 * so they only need an entry to give the AI an evaluator for them.
 */
export type EngineCards<TCards extends CardsLike> = {
    [K in Exclude<keyof TCards, ChoiceKeys<TCards>>]: FunctionalityFor<TCards[K]['targetType']>;
} & {
    [K in ChoiceKeys<TCards>]?: ChoiceTargetCardFunctionality;
};

/** What each of the given status effects does to the system it's on, keyed by effect type. */
export type EngineEffects<TEffects> = { [K in keyof TEffects]: SystemEffectFunctionality };

/**
 * What each of a content folder's cards does, checked against those cards' shared definitions (its `cards/*.shared.ts`):
 * every card must be covered, and each one's functions are given the parameters its target type has.
 */
export function defineEngineCards<TCards extends CardsLike>(_shared: TCards, cards: NoInfer<EngineCards<TCards>>): EngineCards<TCards> {
    return cards;
}

/** What each of a content folder's status effects does, checked against those effects' shared definitions (its `effects/*.shared.ts`): every effect must be covered. */
export function defineEngineEffects<TEffects extends Readonly<Record<string, SystemEffectDefinition>>>(_shared: TEffects, effects: NoInfer<EngineEffects<TEffects>>): EngineEffects<TEffects> {
    return effects;
}

/** A kind of AI ship, which an encounter spawns with `createShipSetup`. */
export interface ShipDesignDefinition extends DesignTemplate {
    /** What a ship of this design is called, unless the encounter names it. */
    name: string;
}

/**
 * A content folder's ship designs (its `ships/*.engine.ts`), keeping each design's name, which `ShipDesign` is worked out from.
 * Each design's appearance is a drawing in the same folder's `ships/` (see `content/registration.test.ts`).
 */
export function defineDesigns<TDesigns extends Record<string, ShipDesignDefinition>>(designs: TDesigns): TDesigns {
    return designs;
}

/**
 * What a content folder adds to the engine: how its shared cards and status effects behave, and any ship designs (using its shared appearances), encounters and sectors it defines.
 * Every one is listed in `content/content.engine.ts`, which the engine registers when it starts (see `registerEngineContent`).
 */
export interface EngineContent<TDesigns extends Record<string, ShipDesignDefinition> = Record<string, ShipDesignDefinition>> {
    readonly side: 'engine';
    /** The folder's shared content, whose cards and effects this gives the behaviour of. */
    readonly shared: AnySharedContent | undefined;
    readonly cards: Readonly<Record<string, EngineCardFunctionality | undefined>>;
    readonly effects: Readonly<Record<string, SystemEffectFunctionality>>;
    readonly designs: TDesigns;
    readonly encounters: readonly EncounterDefinition[];
    readonly sectors: readonly SectorTheme[];
}

interface EngineContentParts<TDesigns> {
    designs?: TDesigns;
    encounters?: readonly EncounterDefinition[];
    sectors?: readonly SectorTheme[];
}

/** The behaviour of every card and effect in the shared content: required where it has any. */
type SharedBehaviour<TShared extends AnySharedContent>
    = (keyof TShared['cards'] extends never ? { cards?: EngineCards<TShared['cards']> } : { cards: EngineCards<TShared['cards']> })
        & (keyof TShared['effects'] extends never ? { effects?: EngineEffects<TShared['effects']> } : { effects: EngineEffects<TShared['effects']> });

export function defineEngineContent<TShared extends AnySharedContent, TDesigns extends Record<string, ShipDesignDefinition> = Record<never, ShipDesignDefinition>>(
    content: { shared: TShared } & SharedBehaviour<TShared> & EngineContentParts<TDesigns>
): EngineContent<TDesigns>;
export function defineEngineContent<TDesigns extends Record<string, ShipDesignDefinition> = Record<never, ShipDesignDefinition>>(
    content: { shared?: undefined; cards?: undefined; effects?: undefined } & EngineContentParts<TDesigns>
): EngineContent<TDesigns>;
export function defineEngineContent(
    content: { shared?: AnySharedContent; cards?: EngineContent['cards']; effects?: EngineContent['effects'] } & EngineContentParts<Record<string, ShipDesignDefinition>>
): EngineContent {
    return {
        side: 'engine',
        shared: content.shared,
        cards: content.cards ?? {},
        effects: content.effects ?? {},
        designs: content.designs ?? {},
        encounters: content.encounters ?? [],
        sectors: content.sectors ?? [],
    };
}

import type { AnySharedContent } from 'common-data/content/SharedContent';
import type { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import type { SectorTheme } from 'src/campaign/sectorThemes';
import type { DesignTemplate } from 'src/campaign/shipDesigns';
import type {
    ChoiceTargetCardFunctionality,
    EnemyTargetCardFunctionality,
    EngineCardFunctionality,
    LocationTargetCardFunctionality,
    NoTargetCardFunctionality,
    ScanTargetCardFunctionality,
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

/** A kind of AI ship, which an encounter spawns with `createShipSetup`. */
export interface ShipDesignDefinition extends DesignTemplate {
    /** What a ship of this design is called, unless the encounter names it. */
    name: string;
}

/**
 * What a content folder adds to the engine: how its shared cards and status effects behave, and any ship designs, encounters and sectors it defines.
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
    = (keyof TShared['cards'] extends never ? { cards?: undefined } : { cards: EngineCards<TShared['cards']> })
        & (keyof TShared['effects'] extends never ? { effects?: undefined } : { effects: EngineEffects<TShared['effects']> });

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

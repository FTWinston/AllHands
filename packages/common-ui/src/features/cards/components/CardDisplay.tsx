import { CardParametersBase } from 'common-data/features/cards/types/CardParameters';
import { CardRarity } from 'common-data/features/cards/types/CardRarity';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { FC, Fragment, useCallback, useContext, useMemo, useState } from 'react';
import { RestrictedHeightText } from '../../../components/RestrictedHeightText';
import crewStyles from '../../../CrewColors.module.css';
import { classNames } from '../../../utils/classNames';
import { CardTargetIcon } from '../assets/cardTargetTypes';
import { UICardDefinition } from '../types/UICardDefinition';
import { CardBase } from './CardBase';
import styles from './CardDisplay.module.css';
import { CardParametersContext, Parameter } from './Parameter';
import { Trait } from './Trait';
import { TraitDescription } from './TraitDescription';

type Props = UICardDefinition & {
    className?: string;
    slotted?: boolean;
    disabled?: boolean;
    highlighted?: boolean;
    sufficientPower?: boolean;
    modifiers?: CardParametersBase;
    extraTraits?: Partial<Record<CardTrait, ExtraTraitType>>;
    /** When false, extra traits still affect how the card looks, but aren't listed in its description or trait descriptions. */
    listExtraTraits?: boolean;
    showTraitDescriptions?: boolean;
};

export const CardDisplay: FC<Props> = (props) => {
    const isDamaged = props.extraTraits?.['damaged'] !== undefined || props.extraTraits?.['critical'] !== undefined;
    const listedExtraTraits = props.listExtraTraits === false ? undefined : props.extraTraits;

    const descriptionContent = useCardDescription(props, listedExtraTraits);
    const traitDescriptions = useCardTraitDescriptions(props.showTraitDescriptions, props.traits, listedExtraTraits);

    return (
        <CardParametersContext.Provider value={{ parameters: props.parameters, modifiers: props.modifiers }}>
            <CardBase className={classNames(
                styles.card,
                crewStyles[props.system],
                props.disabled ? styles.disabled : undefined,
                props.sufficientPower === false ? styles.insufficientPower : undefined,
                props.highlighted ? styles.highlighted : undefined,
                isDamaged ? styles.damaged : undefined,
                props.className)}
            >
                <div className={classNames(styles.image, props.slotted ? styles.noCutouts : styles.cutouts)} role="presentation">{props.image}</div>
                <RestrictedHeightText as="h3" className={styles.name}>
                    {props.name}
                </RestrictedHeightText>

                {props.slotted ? null : <div className={styles.cost}><Parameter name="cost" /></div>}

                {props.slotted || props.parameters['insightCost'] === undefined ? null : <InsightCost />}

                {props.slotted ? null : <CardTargetIcon targetType={props.targetType} className={styles.targetType} />}

                {props.slotted || !props.rarity || props.rarity === 'common' ? null : <RarityMarker rarity={props.rarity} />}

                <RestrictedHeightText className={styles.description}>
                    {descriptionContent}
                </RestrictedHeightText>

                {traitDescriptions}
            </CardBase>
        </CardParametersContext.Provider>
    );
};

/**
 * The Insight a card spends when played, as well as its power cost, shown on the top border beside that cost.
 * It's a lit pip like those of science's Insight meter, so the two read as the same thing.
 */
const InsightCost: FC = () => {
    const { parameters, modifiers } = useContext(CardParametersContext);
    const base = parameters?.['insightCost'];
    const insightCost = (typeof base === 'number' ? base : 0) + (modifiers?.['insightCost'] ?? 0);

    return (
        <div className={styles.insightCost} role="img" aria-label={`Costs ${insightCost} Insight`} title={`Costs ${insightCost} Insight`}>
            <Parameter name="insightCost" />
        </div>
    );
};

const rarityLabels: Record<Exclude<CardRarity, 'common'>, string> = {
    uncommon: 'Uncommon',
    rare: 'Rare',
};

/** Marks an uncommon card with one diamond, and a rare one with two, at the foot of its picture. Common cards have no marker. */
const RarityMarker: FC<{ rarity: Exclude<CardRarity, 'common'> }> = ({ rarity }) => (
    <div className={classNames(styles.rarity, styles[rarity])} role="img" aria-label={rarityLabels[rarity]} title={rarityLabels[rarity]}>
        {rarity === 'rare' ? '◆◆' : '◆'}
    </div>
);

function useCardDescription(props: Props, extraTraits: Props['extraTraits']) {
    // Memoized so that re-renders which don't change the description or extraTraits
    // (e.g. focus/highlight state changes) don't hand RestrictedHeightText a new
    // children reference, which would otherwise re-trigger its font-size measurement.
    return useMemo(() => (
        <>
            {props.description}

            {props.targetType === 'scan' && props.deflectorModifier && (
                <>
                    {' '}
                    <Trait trait={props.deflectorModifier} type={ExtraTraitType.Normal} />
                </>
            )}

            {props.targetType === 'scan' && props.deflectorSubstance && (
                <>
                    {' '}
                    <Trait trait={props.deflectorSubstance} type={ExtraTraitType.Normal} />
                </>
            )}

            {props.targetType === 'scan' && props.deflectorDelivery && (
                <>
                    {' '}
                    <Trait trait={props.deflectorDelivery} type={ExtraTraitType.Normal} />
                </>
            )}

            {extraTraits && (
                Object.entries(extraTraits).map(([trait, traitType]) => {
                    return /* trait === 'damaged' || trait === 'critical' ? null : */ (
                        <Fragment key={trait}>
                            {' '}
                            <Trait
                                trait={trait as CardTrait}
                                type={traitType}
                            />
                        </Fragment>
                    );
                })
            )}
        </>
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [props.description, extraTraits, props.parameters, props.modifiers, props.targetType]);
}

function useCardTraitDescriptions(
    showTraitDescriptions: Props['showTraitDescriptions'],
    traits: Props['traits'],
    extraTraits: Props['extraTraits']
) {
    const [traitsOnLeft, setTraitsOnLeft] = useState(false);
    const traitsRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            const rect = node.parentElement!.getBoundingClientRect();
            setTraitsOnLeft(rect.right + node.offsetWidth + 8 > window.innerWidth);
        }
    }, []);

    return showTraitDescriptions && (
        <div ref={traitsRef} className={classNames(styles.traits, traitsOnLeft ? styles.traitsLeft : undefined)}>
            {traits?.map(trait => (
                <TraitDescription key={trait} trait={trait} type={ExtraTraitType.Normal} />
            ))}
            {extraTraits && Object.entries(extraTraits).map(([trait, traitType]) => (
                <TraitDescription key={trait} trait={trait as CardTrait} type={traitType} />
            ))}
        </div>
    );
}

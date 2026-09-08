import { CardParametersBase } from 'common-data/features/cards/types/CardParameters';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { FC, Fragment, useCallback, useMemo, useState } from 'react';
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
    damaged?: boolean;
    highlighted?: boolean;
    sufficientPower?: boolean;
    modifiers?: CardParametersBase;
    extraTraits?: Partial<Record<CardTrait, ExtraTraitType>>;
    showTraitDescriptions?: boolean;
};

export const CardDisplay: FC<Props> = (props) => {
    const [traitsOnLeft, setTraitsOnLeft] = useState(false);
    const traitsRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            const rect = node.parentElement!.getBoundingClientRect();
            setTraitsOnLeft(rect.right + node.offsetWidth + 8 > window.innerWidth);
        }
    }, []);

    // Memoized so that re-renders which don't change the description or extraTraits
    // (e.g. focus/highlight state changes) don't hand RestrictedHeightText a new
    // children reference, which would otherwise re-trigger its font-size measurement.
    const descriptionContent = useMemo(() => (
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

            {props.extraTraits && (
                Object.entries(props.extraTraits).map(([trait, traitType]) => (
                    <Fragment key={trait}>
                        {' '}
                        <Trait
                            trait={trait as CardTrait}
                            type={traitType}
                        />
                    </Fragment>
                ))
            )}
        </>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [props.description, props.extraTraits, props.parameters, props.modifiers, props.targetType]);

    return (
        <CardParametersContext.Provider value={{ parameters: props.parameters, modifiers: props.modifiers }}>
            <CardBase className={classNames(
                styles.card,
                crewStyles[props.crew],
                props.disabled ? styles.disabled : undefined,
                props.sufficientPower === false ? styles.insufficientPower : undefined,
                props.highlighted ? styles.highlighted : undefined,
                props.damaged ? styles.damaged : undefined,
                props.className)}
            >
                <div className={classNames(styles.image, props.slotted ? styles.noCutouts : styles.cutouts)} role="presentation">{props.image}</div>
                <RestrictedHeightText as="h3" className={styles.name}>
                    {props.name}
                </RestrictedHeightText>

                {props.slotted ? null : <div className={styles.cost}><Parameter name="cost" /></div>}

                {props.slotted ? null : <CardTargetIcon targetType={props.targetType} className={styles.targetType} />}

                <RestrictedHeightText className={styles.description}>
                    {descriptionContent}
                </RestrictedHeightText>

                {props.showTraitDescriptions && (
                    <div ref={traitsRef} className={classNames(styles.traits, traitsOnLeft ? styles.traitsLeft : undefined)}>
                        {props.traits?.map(trait => (
                            <TraitDescription key={trait} trait={trait} type={ExtraTraitType.Normal} />
                        ))}
                        {props.extraTraits && Object.entries(props.extraTraits).map(([trait, traitType]) => (
                            <TraitDescription key={trait} trait={trait as CardTrait} type={traitType} />
                        ))}
                    </div>
                )}
            </CardBase>
        </CardParametersContext.Provider>
    );
};

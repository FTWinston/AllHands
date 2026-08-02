import { CardParametersBase } from 'common-data/features/cards/types/CardParameters';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
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
    highlighted?: boolean;
    sufficientPower?: boolean;
    modifiers?: CardParametersBase;
    extraTraits?: CardTrait[];
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
                    <Trait type="deflectorModifier" parameter={props.deflectorModifier} />
                </>
            )}

            {props.targetType === 'scan' && props.deflectorSubstance && (
                <>
                    {' '}
                    <Trait type="deflectorSubstance" parameter={props.deflectorSubstance} />
                </>
            )}

            {props.targetType === 'scan' && props.deflectorDelivery && (
                <>
                    {' '}
                    <Trait type="deflectorDelivery" parameter={props.deflectorDelivery} />
                </>
            )}

            {props.extraTraits && props.extraTraits.length > 0 && (
                props.extraTraits.map(trait => (
                    <Fragment key={trait}>
                        {' '}
                        <Trait type={trait} />
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

                {props.showTraitDescriptions && (() => {
                    const allTraits = [
                        ...(props.traits ?? []),
                        ...(props.extraTraits ?? []),
                    ];
                    return allTraits.length > 0 && (
                        <div ref={traitsRef} className={classNames(styles.traits, traitsOnLeft ? styles.traitsLeft : undefined)}>
                            {allTraits.map(trait => (
                                <TraitDescription key={trait} trait={trait} />
                            ))}
                        </div>
                    );
                })()}
            </CardBase>
        </CardParametersContext.Provider>
    );
};

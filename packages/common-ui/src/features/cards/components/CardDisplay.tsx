import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { FC, ReactNode, useCallback, useState } from 'react';
import crewStyles from '../../../CrewColors.module.css';
import { classNames } from '../../../utils/classNames';
import { CardTargetIcon } from '../assets/cardTargetTypes';
import { CardBase } from './CardBase';
import styles from './CardDisplay.module.css';
import { CardParametersContext, Parameter } from './Parameter';
import { TraitDescription } from './TraitDescription';

type Props = {
    className?: string;
    slotted?: boolean;
    disabled?: boolean;
    name: string;
    crew: CrewRoleName;
    targetType: CardTargetType;
    description: ReactNode;
    image: ReactNode;
    nameFontSize?: number;
    descriptionLineHeight?: number;
    cost: number;
    sufficientPower?: boolean;
    parameters?: CardParameters;
    modifiers?: CardParameters;
    traits?: CardTrait[];
    showTraits?: boolean;
};

export const CardDisplay: FC<Props> = (props) => {
    const [traitsOnLeft, setTraitsOnLeft] = useState(false);
    const traitsRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            const rect = node.parentElement!.getBoundingClientRect();
            setTraitsOnLeft(rect.right + node.offsetWidth + 8 > window.innerWidth);
        }
    }, []);

    return (
        <CardParametersContext.Provider value={props}>
            <CardBase className={classNames(
                styles.card,
                crewStyles[props.crew],
                props.disabled ? styles.disabled : undefined,
                props.sufficientPower === false ? styles.insufficientPower : undefined,
                props.className)}
            >
                <div className={classNames(styles.image, props.slotted ? styles.noCutouts : styles.cutouts)} role="presentation">{props.image}</div>
                <h3
                    className={styles.name}
                    style={props.nameFontSize ? { fontSize: `${props.nameFontSize}em` } : undefined}
                >
                    {props.name}
                </h3>

                {props.slotted ? null : <div className={styles.cost}><Parameter name="cost" /></div>}

                {props.slotted ? null : <CardTargetIcon targetType={props.targetType} className={styles.targetType} />}

                <p
                    className={styles.description}
                    style={props.descriptionLineHeight ? { lineHeight: `${props.descriptionLineHeight}em` } : undefined}
                >
                    {props.description}
                </p>

                {props.showTraits && props.traits && props.traits.length > 0 && (
                    <div ref={traitsRef} className={classNames(styles.traits, traitsOnLeft ? styles.traitsLeft : undefined)}>
                        {props.traits.map(trait => (
                            <TraitDescription key={trait} trait={trait} />
                        ))}
                    </div>
                )}
            </CardBase>
        </CardParametersContext.Provider>
    );
};

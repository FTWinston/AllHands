import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { FC } from 'react';
import { classNames } from '../../../utils/classNames';
import { getTraitDisplayName } from '../utils/getTraitDisplayName';
import styles from './Trait.module.css';

export type TraitProps = {
    type: CardTrait;
    external?: boolean;
};

/**
 * A component that displays a card trait.
 * Used in the traits list above the card description.
 */
export const Trait: FC<TraitProps> = ({ type, external }) => {
    return <span className={classNames(styles.trait, external ? styles.external : undefined)}>{getTraitDisplayName(type)}</span>;
};

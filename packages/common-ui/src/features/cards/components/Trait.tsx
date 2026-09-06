import { FC } from 'react';
import { classNames } from '../../../utils/classNames';
import { DisplayableTrait, getTraitDisplayName } from '../utils/getTraitDisplayName';
import styles from './Trait.module.css';

export type TraitProps = {
    type: DisplayableTrait;
    removeOnPlay?: boolean;
    external?: boolean;
};

/**
 * A component that displays a card trait.
 * Used in the traits list above the card description.
 */
export const Trait: FC<TraitProps> = ({ type, external, removeOnPlay }) => {
    return <span className={classNames(styles.trait, external ? styles.external : undefined, removeOnPlay ? styles.removeOnPlay : undefined)}>{getTraitDisplayName(type)}</span>;
};

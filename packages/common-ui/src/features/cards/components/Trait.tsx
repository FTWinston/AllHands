import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { FC } from 'react';
import { classNames } from '../../../utils/classNames';
import { DisplayableTrait, getTraitDisplayName } from '../utils/getTraitDisplayName';
import styles from './Trait.module.css';

export type TraitProps = {
    trait: DisplayableTrait;
    type?: ExtraTraitType;
    external?: boolean;
};

/**
 * A component that displays a card trait.
 * Used in the traits list above the card description.
 */
export const Trait: FC<TraitProps> = ({ trait, type, external }) => (
    <span className={classNames(
        styles.trait,
        external ? styles.external : undefined,
        type === ExtraTraitType.RemoveOnPlay ? styles.removeOnPlay : undefined,
        type === ExtraTraitType.Negative ? styles.negative : undefined
    )}
    >
        {getTraitDisplayName(trait)}
    </span>
);

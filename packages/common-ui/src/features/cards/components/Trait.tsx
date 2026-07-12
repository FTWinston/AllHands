import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { FC } from 'react';
import { classNames } from '../../../utils/classNames';
import styles from './Trait.module.css';

export type TraitProps = {
    type: CardTrait;
    external?: boolean;
};

/**
 * Converts a camelCase trait identifier to a user-friendly display string.
 */
export function getTraitDisplayName(trait: CardTrait): string {
    switch (trait) {
        case 'expendable':
            return 'Expendable';
        case 'primary':
            return 'Primary';
        case 'energyWeapon':
            return 'Energy weapon';
        case 'torpedoWeapon':
            return 'Torpedo weapon';
    }
}

/**
 * A component that displays a card trait.
 * Used in the traits list above the card description.
 */
export const Trait: FC<TraitProps> = ({ type, external }) => {
    return <span className={classNames(styles.trait, external ? styles.external : undefined)}>{getTraitDisplayName(type)}</span>;
};

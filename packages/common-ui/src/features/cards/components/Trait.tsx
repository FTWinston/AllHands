import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { FC } from 'react';
import styles from './Trait.module.css';

type Props = {
    type: CardTrait;
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
export const Trait: FC<Props> = ({ type }) => {
    return <span className={styles.trait}>{getTraitDisplayName(type)}</span>;
};

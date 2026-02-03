import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { FC } from 'react';
import styles from './Trait.module.css';

type Props = {
    type: CardTrait;
};

/**
 * A component that displays a card trait.
 * Used in the traits list above the card description.
 */
export const Trait: FC<Props> = ({ type }) => {
    return <span className={styles.trait}>{type}</span>;
};

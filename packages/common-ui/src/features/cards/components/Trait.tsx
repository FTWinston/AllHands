import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { FC } from 'react';
import styles from './Trait.module.css';

type Props = {
    type: CardTrait;
};

/**
 * A component that displays a card trait in descriptions.
 * This should be used within card descriptions to indicate special behaviors.
 */
export const Trait: FC<Props> = ({ type }) => {
    return <span className={styles.trait}>{type}</span>;
};

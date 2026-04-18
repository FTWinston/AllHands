import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { FC } from 'react';
import { getTraitDescription } from '../utils/getTraitDescription';
import { getTraitDisplayName } from './Trait';
import styles from './TraitDescription.module.css';

type Props = {
    trait: CardTrait;
};

export const TraitDescription: FC<Props> = ({ trait: type }) => {
    return (
        <div className={styles.trait}>
            <h3 className={styles.traitTitle}>{getTraitDisplayName(type)}</h3>
            <div className={styles.traitDescription}>{getTraitDescription(type)}</div>
        </div>
    );
};

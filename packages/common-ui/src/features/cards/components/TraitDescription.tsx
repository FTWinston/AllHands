import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { FC } from 'react';
import { getTraitDescription } from '../utils/getTraitDescription';
import { getTraitDisplayName } from '../utils/getTraitDisplayName';
import styles from './TraitDescription.module.css';

type Props = {
    trait: CardTrait;
    removedWhenPlayed?: boolean;
};

export const TraitDescription: FC<Props> = ({ trait: type, removedWhenPlayed }) => {
    return (
        <div className={styles.trait}>
            <h3 className={styles.traitTitle}>{getTraitDisplayName(type)}</h3>
            <div className={styles.traitDescription}>
                {getTraitDescription(type)}
                {removedWhenPlayed && <div className={styles.removedWhenPlayed}>This trait will be removed when the card is played.</div>}
            </div>
        </div>
    );
};

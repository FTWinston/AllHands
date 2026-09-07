import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { FC } from 'react';
import { getTraitDescription } from '../utils/getTraitDescription';
import { getTraitDisplayName } from '../utils/getTraitDisplayName';
import styles from './TraitDescription.module.css';

type Props = {
    trait: CardTrait;
    type: ExtraTraitType;
};

export const TraitDescription: FC<Props> = ({ trait, type }) => {
    return (
        <div className={styles.trait}>
            <h3 className={styles.traitTitle}>{getTraitDisplayName(trait)}</h3>
            <div className={styles.traitDescription}>
                {getTraitDescription(trait)}
                {type === ExtraTraitType.RemoveOnPlay && <div className={styles.removedWhenPlayed}>This trait will be removed when the card is played.</div>}
                {type === ExtraTraitType.Negative && <div className={styles.negative}>This trait can be removed by certain effects.</div>}
            </div>
        </div>
    );
};

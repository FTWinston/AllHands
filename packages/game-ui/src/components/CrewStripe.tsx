import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import crewStyles from 'common-ui/CrewColors.module.css';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import styles from './CrewStripe.module.css';

type Props = {
    /** Set a font-size here to scale the stripe. */
    className?: string;
};

/** A segment in each crew role's colour: the game's mark, under its name. */
export const CrewStripe: FC<Props> = ({ className }) => (
    <span className={classNames(styles.stripe, className)} aria-hidden="true">
        {crewRoleNames.map(role => (
            <span key={role} className={classNames(styles.segment, crewStyles[role])} />
        ))}
    </span>
);

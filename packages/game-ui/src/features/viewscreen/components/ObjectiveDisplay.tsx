import { getObjectiveLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { sounds } from 'common-ui/features/sound/sounds';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useEffect } from 'react';
import styles from './ObjectiveDisplay.module.css';
import type { EncounterOutcome, ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';

type Props = {
    objective: ObjectiveInfo;
    /** How the encounter ended, or null while that's still undecided. */
    outcome: EncounterOutcome | null;
};

const headings: Record<EncounterOutcome, string> = {
    success: 'Objective complete',
    failure: 'Objective failed',
};

/**
 * What the encounter asks of the crew, in the corner of the viewscreen, and then how that turned out.
 * It says what's wanted and nothing about how it's going: that's for the crew to find out, and to tell each other.
 */
export const ObjectiveDisplay: FC<Props> = ({ objective, outcome }) => {
    useEffect(() => {
        if (outcome === 'success') {
            sounds.objectiveComplete();
        } else if (outcome === 'failure') {
            sounds.objectiveFailed();
        }
    }, [outcome]);

    return (
        <div className={classNames(styles.objective, outcome && styles[outcome])} role="status">
            <span className={styles.heading}>{outcome ? headings[outcome] : 'Objective'}</span>
            <span className={styles.text}>{getObjectiveLabel(objective)}</span>
        </div>
    );
};

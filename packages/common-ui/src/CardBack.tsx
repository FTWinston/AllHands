import styles from './CardBack.module.css';
import { CrewRoleName } from 'common-types';
import { HelmIcon, TacticalIcon, SensorsIcon, EngineeringIcon } from './icons/crew';
import { CardBase } from './CardBase';
import { classNames } from './classNames';

export type Props = {
    crew: CrewRoleName;
    className?: string;
};

export const CardBack: React.FC<Props> = (props) => {
    let crewIcon: React.ReactNode;
    switch (props.crew) {
        case 'helm':
            crewIcon = <HelmIcon className={styles.crew} />;
            break;
        case 'tactical':
            crewIcon = <TacticalIcon className={styles.crew} />;
            break;
        case 'sensors':
            crewIcon = <SensorsIcon className={styles.crew} />;
            break;
        case 'engineer':
            crewIcon = <EngineeringIcon className={styles.crew} />;
            break;
        default:
            crewIcon = null;
    }

    return (
        <CardBase className={classNames(styles.card, styles[props.crew], props.className)} crew={props.crew}>
            <div className={styles.topSpacer} />
            {crewIcon}
            <h3 className={styles.name}>{props.crew}</h3>
        </CardBase>
    );
}
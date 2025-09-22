import styles from './Card.module.css';
import { CrewRoleName } from 'common-types';
import { HelmIcon, TacticalIcon, SensorsIcon, EngineeringIcon } from './icons/crew';
import { CardBase } from './CardBase';

export type Props = {
    name: string;
    crew: CrewRoleName;
    description: string;
    image: React.ReactNode;
    cost: number;
    className?: string;
};

export const Card: React.FC<Props> = (props) => {
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
        <CardBase className={props.className} crew={props.crew}>
            <div className={styles.image} role="presentation">{props.image}</div>
            <h3 className={styles.name}>{props.name}</h3>
            {crewIcon}
            <div className={styles.cost}>{props.cost}</div>
            <p className={styles.description}>{props.description}</p>
        </CardBase>
    );
}
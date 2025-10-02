import { CrewRoleName } from 'common-types';
import { FC, PropsWithChildren } from 'react';
import styles from './CardBase.module.css';
import { classNames } from './classNames';
import crewStyles from './CrewColors.module.css';

export type Props = PropsWithChildren<{
    crew: CrewRoleName;
    className?: string;
}>;

export const CardBase: FC<Props> = (props) => {
    return (
        <div className={classNames(styles.card, crewStyles[props.crew], props.className)}>
            {props.children}
        </div>
    );
};

import styles from './CardBase.module.css';
import { classNames } from './classNames';
import { CrewRoleName } from 'common-types';
import { PropsWithChildren } from 'react';

export type Props = PropsWithChildren<{
    crew: CrewRoleName;
    className?: string;
}>;

export const CardBase: React.FC<Props> = (props) => {
    return (
        <div className={classNames(styles.card, styles[props.crew], props.className)}>
            {props.children}
        </div>
    );
}
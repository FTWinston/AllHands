import { MinimalReadonlyMap } from 'common-data/types/MinimalArray';
import { FC, createContext, useContext } from 'react';
import { classNames } from '../../../utils/classNames';
import styles from './Parameter.module.css';

export const CardParametersContext = createContext<{
    parameters?: Record<string, number | string>;
    modifiers?: MinimalReadonlyMap<string, number>;
}>({});

type Props = {
    name: string;
};

export const Parameter: FC<Props> = ({ name }) => {
    const { parameters, modifiers } = useContext(CardParametersContext);

    const base = parameters?.[name] ?? 0;

    if (typeof base === 'string') {
        return (
            <span className={styles.parameter}>
                {base}
            </span>
        );
    }

    const modifier = modifiers?.get(name) ?? 0;
    const value = base + modifier;

    let modifierClass: string | undefined;
    if (modifier < 0) {
        modifierClass = styles.decreased;
    } else if (modifier > 0) {
        modifierClass = styles.increased;
    }

    return (
        <span
            className={classNames(styles.parameter, modifierClass)}
        >
            {value}
        </span>
    );
};

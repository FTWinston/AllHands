import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { FC, createContext, useContext } from 'react';
import { classNames } from '../../../utils/classNames';
import styles from './Parameter.module.css';

export const CardParametersContext = createContext<{
    parameters?: CardParameters;
    modifiers?: CardParameters;
}>({});

type Props = {
    name: string;
};

export const Parameter: FC<Props> = ({ name }) => {
    const { parameters, modifiers } = useContext(CardParametersContext);

    const base = parameters?.get(name) ?? 0;
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

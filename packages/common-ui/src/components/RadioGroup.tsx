import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import { FC } from 'react';
import { classNames } from '../utils/classNames';
import styles from './RadioGroup.module.css';

type RadioOption = {
    id: string;
    label: string;
    disabled?: boolean;
};

type Props = {
    value: string;
    setValue: (value: string) => void;
    options: RadioOption[];
    className?: string;
};

export const RadioGroup: FC<Props> = ({ value, setValue, options, className }) => (
    <BaseTabs.Root value={value} onValueChange={setValue} className={classNames(styles.tabs, className)}>
        <BaseTabs.List className={styles.list}>
            {options.map(option => (
                <BaseTabs.Tab className={styles.tab} value={option.id} key={option.id} disabled={option.disabled}>
                    {option.label}
                </BaseTabs.Tab>
            ))}
            <BaseTabs.Indicator className={styles.indicator} />
        </BaseTabs.List>
    </BaseTabs.Root>
);

import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import { classNames } from '../utils/classNames';
import styles from './RadioGroup.module.css';

type RadioOption<T extends string> = {
    id: T;
    label: string;
    disabled?: boolean;
};

type Props<T extends string> = {
    value: T;
    setValue: (value: T) => void;
    options: RadioOption<T>[];
    className?: string;
};

export const RadioGroup = <T extends string>({ value, setValue, options, className }: Props<T>) => (
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

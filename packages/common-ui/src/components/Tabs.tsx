import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import { FC, ReactNode } from 'react';
import { classNames } from '../utils/classNames';
import styles from './Tabs.module.css';

type TabInfo = {
    id: string;
    label: string;
    disabled?: boolean;
    content: ReactNode;
};

type Props = {
    defaultTabId: string;
    tabs: TabInfo[];
    className?: string;
};

export const Tabs: FC<Props> = ({ defaultTabId, tabs, className }) => (
    <BaseTabs.Root defaultValue={defaultTabId} className={classNames(styles.tabs, className)}>
        <BaseTabs.List className={styles.list}>
            {tabs.map(tab => (
                <BaseTabs.Tab className={styles.tab} value={tab.id} key={tab.id} disabled={tab.disabled}>
                    {tab.label}
                </BaseTabs.Tab>
            ))}
            <BaseTabs.Indicator className={styles.indicator} />
        </BaseTabs.List>
        {tabs.map(tab => (
            <BaseTabs.Panel className={styles.tabPanel} value={tab.id} key={tab.id}>
                {tab.content}
            </BaseTabs.Panel>
        ))}
    </BaseTabs.Root>
);

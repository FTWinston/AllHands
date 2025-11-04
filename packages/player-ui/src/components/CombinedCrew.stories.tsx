import ErrorBoundary from 'common-ui/ErrorBoundary';
import { FC } from 'react';
import styles from './CombinedCrew.module.css';
import type { Meta, StoryObj } from '@storybook/react-vite';

const Component: FC = () => (
    <div className={styles.root}>
        <ErrorBoundary>
            <iframe title="engineer" src="/iframe.html?globals=&args=&id=player-ui-engineer--engineer&viewMode=story" />
        </ErrorBoundary>
        <ErrorBoundary>
            <iframe title="helm" src="/iframe.html?globals=&args=&id=player-ui-helm--helm&viewMode=story" />
        </ErrorBoundary>
        <ErrorBoundary>
            <iframe title="tactical" src="/iframe.html?globals=&args=&id=player-ui-tactical--tactical&viewMode=story" />
        </ErrorBoundary>
        <ErrorBoundary>
            <iframe title="sensors" src="/iframe.html?globals=&args=&id=player-ui-sensors--sensors&viewMode=story" />
        </ErrorBoundary>
    </div>
);

const meta: Meta<typeof Component> = {
    title: 'player-ui/Combined',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Combined: Story = {};

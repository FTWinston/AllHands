import { fn } from 'storybook/test';

import { MainMenu as MainMenuComponent } from './MainMenu';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'game-ui/MainMenu',
    component: MainMenuComponent,
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { hostServer: fn(), joinServer: fn(), quit: fn() },
} satisfies Meta<typeof MainMenuComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MainMenu: Story = {
    args: {},
};

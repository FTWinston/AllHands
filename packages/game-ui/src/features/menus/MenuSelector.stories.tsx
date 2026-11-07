import { fn, expect, userEvent, within } from 'storybook/test';

import { MenuSelector as Component } from './MenuSelector';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'game-ui/Menus/Selector',
    component: Component,
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        hostSingleCrewServer: fn(),
        hostMultiCrewServer: fn(),
        joinServer: fn(),
        disconnect: fn(),
        resumeGame: fn(),
        quit: fn(),
    },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selector: Story = {
    args: {
        isConnectedToGame: false,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();

        // Click "Start single-crew game" button
        const singleCrewButton = canvas.getByText('Start single-crew game');
        await user.click(singleCrewButton);
        await expect(args.hostSingleCrewServer).toHaveBeenCalled();

        // Click "Host multi-crew game" button
        const hostMultiCrewButton = canvas.getByText('Host multi-crew game');
        await user.click(hostMultiCrewButton);
        await expect(args.hostMultiCrewServer).toHaveBeenCalled();

        // Click "Join multi-crew game" button
        const joinMultiCrewButton = canvas.getByText('Join multi-crew game');
        await user.click(joinMultiCrewButton);

        // Verify join button is disabled initially
        const joinButton = canvas.getByRole('button', { name: 'Join' });
        expect(joinButton).toBeDisabled();

        // Enter IP address
        const ipInput = canvas.getByPlaceholderText('IP address');
        await user.type(ipInput, '127.0.0.1');

        // Enter port
        const portInput = canvas.getByPlaceholderText('Port');
        await user.type(portInput, '23552');

        // Click join button and verify action was called
        await user.click(joinButton);
        await expect(args.joinServer).toHaveBeenCalledWith({
            ip: '127.0.0.1',
            port: 23552,
        });

        // Click back button
        const backButton = canvas.getByText('Go back');
        await user.click(backButton);

        // View the card compendium, then go back
        await user.click(canvas.getByText('Card compendium'));
        await expect(canvas.getByRole('heading', { name: 'Card compendium' })).toBeInTheDocument();
        await user.click(canvas.getByRole('button', { name: 'Back' }));

        // View the settings, then go back
        await user.click(canvas.getByText('Settings'));
        await expect(canvas.getByText('Shake and flashes')).toBeInTheDocument();
        await user.click(canvas.getByText('Go back'));

        // Click quit button
        const quitButton = canvas.getByText('Quit');
        await user.click(quitButton);

        // Cancel in the dialog (dialog is in a portal, so query document)
        const cancelButton = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('Cancel'));
        await user.click(cancelButton as HTMLElement);
        await expect(args.quit).not.toHaveBeenCalled();

        // Click quit again
        await user.click(quitButton);

        // Confirm in the dialog (dialog is in a portal, so query document)
        const confirmButton = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent?.includes('OK'));
        await user.click(confirmButton as HTMLElement);
        await expect(args.quit).toHaveBeenCalled();
    },
};

export const InGame: Story = {
    args: {
        isConnectedToGame: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();

        // The settings are a level down from the in-game menu.
        await expect(canvas.queryByText('Shake and flashes')).not.toBeInTheDocument();
        await user.click(canvas.getByText('Settings'));

        // Toggling a setting shows its new value. Toggle it back, as it's remembered between stories.
        const soundEffects = canvas.getByRole('button', { name: /Sound effects/ });
        const initialValue = soundEffects.textContent;
        await user.click(soundEffects);
        await expect(soundEffects.textContent).not.toEqual(initialValue);
        await user.click(soundEffects);
        await expect(soundEffects.textContent).toEqual(initialValue);

        // A toggle stays where it is, so unlike "Go back" it has no chevron saying it goes somewhere.
        const goBack = canvas.getByRole('button', { name: /Go back/ });
        await expect(soundEffects.querySelector('svg')).toBeNull();
        await expect(goBack.querySelector('svg')).not.toBeNull();

        // Going back returns to the in-game menu, not the main menu.
        await user.click(goBack);
        await expect(canvas.getByText('Game paused')).toBeInTheDocument();
    },
};

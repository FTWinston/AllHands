import type { Preview } from '@storybook/react-vite';
import { TimeProviderContext } from '../packages/common-ui/src/contexts/TimeProviderContext';
import '../packages/common-ui/src/baseline';

const timeProvider = { getServerTime: () => Date.now() };

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },

        a11y: {
            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: 'todo',
        },
    },

    decorators: [
        Story => (
            <TimeProviderContext.Provider value={timeProvider}>
                <Story />
            </TimeProviderContext.Provider>
        ),
    ],
};

export default preview;

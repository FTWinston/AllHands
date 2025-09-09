import type { Preview } from '@storybook/react-vite';
import '../packages/common-ui/src/main.css';

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;

import { ErrorBoundary } from 'common-ui';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { GameUI } from './components/GameUI';

import type { ClientConfig, ServerAddress } from 'common-types';

import 'common-ui/main.css';

declare global {
    interface Window {
        electronAPI: {
            getClientConfig: () => Promise<ClientConfig>;
            startServer: () => Promise<ServerAddress>;
            stopServer: () => Promise<void>;
            quit: () => Promise<void>;
        };
    }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
        <ErrorBoundary>
            <GameUI />
        </ErrorBoundary>
    </StrictMode>,
);

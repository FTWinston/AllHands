import { ErrorBoundary } from 'common-ui/components/ErrorBoundary';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { GameUI } from './components/GameUI';

import type { ClientConfig, ServerAddress, ServerConfig } from 'common-types';

import 'common-ui/baseline';

declare global {
    interface Window {
        electronAPI: {
            getClientConfig: () => Promise<ClientConfig>;
            startServer: (configOverride?: Partial<ServerConfig>) => Promise<ServerAddress>;
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
    </StrictMode>
);

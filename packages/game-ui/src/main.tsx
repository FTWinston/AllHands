import { ErrorBoundary } from 'common-ui/components/ErrorBoundary';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { GameUI } from './components/GameUI';

import type { ClientConfig } from 'common-data/types/ClientConfig';
import type { ServerAddress } from 'common-data/types/ServerAddress';
import type { ServerConfig } from 'common-data/types/ServerConfig';

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

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'common-ui';
import type { ClientConfig, ServerAddress } from 'common-types';
import { GameApp } from './components/GameApp';
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
            <GameApp />
        </ErrorBoundary>
    </StrictMode>,
);

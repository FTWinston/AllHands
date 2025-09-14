import { ErrorBoundary } from 'common-ui';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { PlayerUI } from './components/PlayerUI';
import 'common-ui/main.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
        <ErrorBoundary>
            <PlayerUI />
        </ErrorBoundary>
    </StrictMode>,
);

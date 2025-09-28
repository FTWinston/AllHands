import { ErrorBoundary } from 'common-ui/ErrorBoundary';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { PlayerUI } from './components/PlayerUI';
import 'common-ui/baseline';
import 'drag-drop-touch';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
        <ErrorBoundary>
            <PlayerUI />
        </ErrorBoundary>
    </StrictMode>,
);

import { ErrorBoundary } from 'common-ui/components/ErrorBoundary';
import { registerUiContent } from 'common-ui/content/registerUiContent';
import { uiContent } from 'content/content.ui';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { PlayerUI } from './components/PlayerUI';
import 'common-ui/baseline';

registerUiContent(uiContent);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
        <ErrorBoundary>
            <PlayerUI />
        </ErrorBoundary>
    </StrictMode>
);

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import QRCode from "react-qr-code";
import { ErrorBoundary } from 'shared';
import type { AppConfig } from 'host/src/getConfig';
import { Chat } from './Chat';

declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<AppConfig>;
    };
  }
}

const App = () => {
  const [appConfig, setAppConfig] = useState<AppConfig>();

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.electronAPI.getConfig();
      setAppConfig(config);
    }
    fetchConfig();
  }, []);

  const serverUrl = appConfig ? `http://${appConfig.ipAddress}:${appConfig.httpPort}` : '';

  return (
    <React.StrictMode>
      <h1>Host UI</h1>
      {appConfig ? (
        <div>
          <h2>Scan to connect</h2>
          <p>Open your phone camera and scan the QR code below to join the game.</p>
          <p>Or open your browser and go to <a href={serverUrl}>{serverUrl}</a></p>
          <QRCode value={serverUrl} size={256} />
          <Chat appConfig={appConfig} />
        </div>
      ) : (
        <p>Waiting for server to start...</p>
      )}
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

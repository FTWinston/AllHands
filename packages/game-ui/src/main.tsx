import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import QRCode from "react-qr-code";
import { ErrorBoundary } from "common-ui";
import type { ClientConfig } from "common-types";
import { Chat } from "./Chat";

declare global {
    interface Window {
        electronAPI: {
            getClientConfig: () => Promise<ClientConfig>;
            quit: () => Promise<void>;
        };
    }
}

const App = () => {
    const [clientConfig, setClientConfig] = useState<ClientConfig>();

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await window.electronAPI.getClientConfig();
            setClientConfig(config);
        };
        fetchConfig();
    }, []);

    const serverUrl = clientConfig
        ? `http://${clientConfig.serverIpAddress}:${clientConfig.serverHttpPort}`
        : "";

    return (
        <React.StrictMode>
            <h1>Host UI</h1>
            {clientConfig ? (
                <div>
                    <h2>Scan to connect</h2>
                    <p>
                        Open your phone camera and scan the QR code below to
                        join the game.
                    </p>
                    <p>
                        Or open your browser and go to{" "}
                        <a href={serverUrl}>{serverUrl}</a>
                    </p>
                    <QRCode value={serverUrl} size={256} />
                    <Chat clientConfig={clientConfig} />
                </div>
            ) : (
                <p>Waiting for server to start...</p>
            )}

            <button onClick={window.electronAPI.quit}>quit app</button>
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>,
);

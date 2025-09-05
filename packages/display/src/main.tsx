import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import QRCode from "react-qr-code";
import { ErrorBoundary } from "common-ui";
import type { ServerConfig } from "server/types/ServerConfig";
import { Chat } from "./Chat";

declare global {
    interface Window {
        electronAPI: {
            getConfig: () => Promise<ServerConfig>;
        };
    }
}

const App = () => {
    const [serverConfig, setServerConfig] = useState<ServerConfig>();

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await window.electronAPI.getConfig();
            setServerConfig(config);
        };
        fetchConfig();
    }, []);

    const serverUrl = serverConfig
        ? `http://${serverConfig.ipAddress}:${serverConfig.httpPort}`
        : "";

    return (
        <React.StrictMode>
            <h1>Host UI</h1>
            {serverConfig ? (
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
                    <Chat serverConfig={serverConfig} />
                </div>
            ) : (
                <p>Waiting for server to start...</p>
            )}
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>,
);

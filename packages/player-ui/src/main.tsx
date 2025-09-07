import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "common-ui";
import { Chat } from "./Chat";
import "common-ui/main.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ErrorBoundary>
            <h1>Player UI</h1>
            <Chat />
        </ErrorBoundary>
    </React.StrictMode>,
);

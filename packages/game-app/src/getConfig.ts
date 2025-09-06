import fs from "fs";
import os from "os";
import path from "path";
import type { ClientConfig, ServerConfig } from "common-types";

export type CombinedConfigs = {
    clientConfig: ClientConfig;
    serverConfig: ServerConfig;
};

function getIpAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        if (networkInterface) {
            for (const anInterface of networkInterface) {
                if (anInterface.family === "IPv4" && !anInterface.internal) {
                    return anInterface.address;
                }
            }
        }
    }

    return "127.0.0.1";
}

function loadClientConfig(serverConfig: ServerConfig) {
    const clientConfigFromFile: Partial<ClientConfig> = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "..", "config", "client.json"),
            "utf-8",
        ),
    );

    // Delete settings that should never come from the client config file.
    delete clientConfigFromFile.serverIpAddress;
    delete clientConfigFromFile.serverHttpPort;

    const clientDefaults: ClientConfig = {
        fullscreen: true,
        width: 1024,
        height: 768,
        serverHttpPort: serverConfig.httpPort,
        serverIpAddress: serverConfig.ipAddress,
    };

    const clientConfig: ClientConfig = {
        ...clientDefaults,
        ...clientConfigFromFile,
    };
    return clientConfig;
}

function loadServerConfig() {
    const serverConfigFromFile: Partial<ServerConfig> = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "..", "config", "server.json"),
            "utf-8",
        ),
    );

    // Delete settings that should never come from the server config file.
    delete serverConfigFromFile.ipAddress;

    const serverDefaults: ServerConfig = {
        ipAddress: getIpAddress(),
        httpPort: 2567,
        pingInterval: 1000,
        simulateLatencyMs: 0,
        gameMode: "survival",
        multiship: false,
    };

    const serverConfig: ServerConfig = {
        ...serverDefaults,
        ...serverConfigFromFile,
    };
    return serverConfig;
}

function loadConfig(): CombinedConfigs {
    const serverConfig = loadServerConfig();

    const clientConfig = loadClientConfig(serverConfig);

    return { clientConfig, serverConfig };
}

let config: CombinedConfigs | null = null;

export function getConfig() {
    if (!config) {
        config = loadConfig();
    }

    return config;
}

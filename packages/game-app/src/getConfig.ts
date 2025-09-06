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

function loadConfig(): CombinedConfigs {
    const clientConfigFromFile: Partial<ClientConfig> = JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "client.json"), "utf-8"),
    );

    const clientDefaults: ClientConfig = {
        fullscreen: true,
        width: 1024,
        height: 768,
        serverHttpPort: 2567,
        serverIpAddress: getIpAddress(),
    };

    const clientConfig: ClientConfig = {
        ...clientDefaults,
        ...clientConfigFromFile,
    };

    const serverConfigFromFile: Partial<ServerConfig> = JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "server.json"), "utf-8"),
    );

    const serverDefaults: ServerConfig = {
        httpPort: clientConfig.serverHttpPort,
        gameMode: "survival",
        multiship: false,
    };

    const serverConfig: ServerConfig = {
        ...serverDefaults,
        ...serverConfigFromFile,
    };

    return { clientConfig, serverConfig };
}

let config: CombinedConfigs | null = null;

export function getConfig() {
    if (!config) {
        config = loadConfig();
    }

    return config;
}

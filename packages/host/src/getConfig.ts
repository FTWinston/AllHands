import fs from "fs";
import os from "os";
import path from "path";
import type { ServerConfig } from "server/src/types/ServerConfig";

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

function loadConfig(): ServerConfig {
    const config: Partial<ServerConfig> = JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "config.json"), "utf-8"),
    );

    const defaults: ServerConfig = {
        fullscreen: true,
        width: 1024,
        height: 768,
        httpPort: 2567,
        ipAddress: getIpAddress(),
    };

    return {
        ...defaults,
        ...config,
    };
}

let config: ServerConfig | null = null;

export function getConfig() {
    if (!config) {
        config = loadConfig();
    }

    return config;
}

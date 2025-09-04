import fs from 'fs';
import os from 'os';
import path from 'path';

function getIpAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        if (networkInterface) {
            for (const anInterface of networkInterface) {
                if (anInterface.family === 'IPv4' && !anInterface.internal) {
                    return anInterface.address;
                }
            }
        }
    }

    return '127.0.0.1';
}

export type AppConfig = {
    ipAddress: string;
    httpPort: number;
}

function loadConfig(): AppConfig {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));

    config.ipAddress = getIpAddress();

    return config;
}

let config: AppConfig | null = null;

export function getConfig() {
    if (!config) {
        config = loadConfig();
    }

    return config;
}

import fs from 'fs';
import os from 'os';
import path from 'path';

import type { ServerConfig } from 'common-data/types/ServerConfig';

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

export function getServerConfig() {
    const serverConfigFromFile: Partial<ServerConfig> = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, '..', 'config', 'server.json'),
            'utf-8'
        )
    );

    // Delete settings that should never come from the server config file.
    delete serverConfigFromFile.ipAddress;

    const serverDefaults: ServerConfig = {
        ipAddress: getIpAddress(),
        httpPort: 2567,
        pingInterval: 1000,
        simulateLatencyMs: 0,
        gameMode: 'survival',
        multiship: false,
    };

    const serverConfig: ServerConfig = {
        ...serverDefaults,
        ...serverConfigFromFile,
    };

    return serverConfig;
}

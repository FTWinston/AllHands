import fs from 'fs';
import path from 'path';

import type { ClientConfig } from 'common-data/types/ClientConfig';

export function getClientConfig(): ClientConfig {
    const clientConfigFromFile: Partial<ClientConfig> = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, '..', 'config', 'client.json'),
            'utf-8'
        )
    );

    const clientDefaults: ClientConfig = {
        fullscreen: true,
        width: 1024,
        height: 768,
    };

    const clientConfig: ClientConfig = {
        ...clientDefaults,
        ...clientConfigFromFile,
    };
    return clientConfig;
}

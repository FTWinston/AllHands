export type ServerConfig = {
    ipAddress: string;
    httpPort: number;
    pingInterval: number;
    simulateLatencyMs: number;
    gameMode: 'survival' | 'adventure';
    multiship: boolean;
};

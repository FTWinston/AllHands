export type ServerConfig = {
    ipAddress: string;
    httpPort: number;
    pingInterval: number;
    simulateLatencyMs: number;
    tickRate: number;
    patchRate: number;
    multiship: boolean;
};

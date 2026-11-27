export type ServerConfig = {
    ipAddress: string;
    httpPort: number;
    pingInterval: number;
    simulateLatencyMs: number;
    tickRate: number;
    patchRate: number;
    multiship: boolean;
    timeScale: number;
    /**
     * Dev tools only: once every role is claimed, start straight away (without the countdown) in this encounter, in place of the first sector's intro.
     * An encounter id, optionally followed by `:elite`, or for the card range, by `:` and the card to start on, e.g. `cardRange:phaserCannon`.
     * Set from the `DEV_START` environment variable.
     */
    devStart?: string;
};

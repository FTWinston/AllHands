export type ClientConfig = {
    fullscreen: boolean;
    width: number;
    height: number;
    /** Dev tools only: host a single-crew game as soon as the main menu opens, as `DEV_START` is set (see `ServerConfig.devStart`). */
    autoHost?: boolean;
};

/**
 * Whether the dev tools are enabled. The engine's build fixes this from the DEV_TOOLS environment variable (see build.mjs),
 * and tests read it from the environment when they run.
 */
export const DEV_TOOLS_ENABLED = process.env.DEV_TOOLS === 'true';

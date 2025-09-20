import { defineConfig, mergeConfig } from 'vite';

import commonConfig from '../../vite.common.config';

export default defineConfig((env) => {
    return mergeConfig(commonConfig(env), {
        base: './',
    });
});

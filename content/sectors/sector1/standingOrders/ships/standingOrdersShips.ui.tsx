import { defineUiShips } from 'common-ui/content/UiContent';
import { shieldOutlines } from './shieldOutlines.generated.ui';
import { appearances } from './standingOrdersShips.shared';
import type { SvgComponent } from 'common-ui/objects/shipDrawings';

export const drawings = defineUiShips(appearances, {
    icons: import.meta.glob<SvgComponent>('./*.svg', { query: '?react', import: 'default', eager: true }),
    svgs: import.meta.glob<string>('./*.svg', { query: '?raw', import: 'default', eager: true }),
    shieldOutlines,
});

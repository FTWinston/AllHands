import { defineUiContent } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { standingOrdersShared } from './standingOrders.shared';

export const standingOrdersUi = defineUiContent({
    shared: standingOrdersShared,
    effects: {
        phasedPing: {
            name: 'Phased Ping',
            description: <>Something has pinged this system with a phased signal. It does no harm.</>,
            image: ExampleIcon,
        },
        coherentPing: {
            name: 'Coherent Ping',
            description: <>Something has pinged this system with a coherent signal. It does no harm.</>,
            image: ExampleIcon,
        },
        invertedPing: {
            name: 'Inverted Ping',
            description: <>Something has pinged this system with an inverted signal. It does no harm.</>,
            image: ExampleIcon,
        },
    },
});

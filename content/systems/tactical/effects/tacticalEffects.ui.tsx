import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './tacticalEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    flareBurning: {
        name: 'Flare Burning',
        description: <>A flare launched from this ship is burning, dazzling sensors nearby.</>,
        image: ExampleIcon,
    },
    holdingFire: {
        name: 'Holding Fire',
        description: <>Weapons can't fire. When this ends, Lock is gained on the ship that was locked.</>,
        image: ExampleIcon,
    },
    calledShot: {
        name: 'Called Shot',
        description: <>Every crew system of the locked ship can be aimed at, until the next shot at it.</>,
        image: ExampleIcon,
    },
    lock: {
        name: 'Lock',
        description: <>Weapons are locked onto one ship. Each level makes every shot at it more accurate. Lock fades by a level each time a while passes without any being gained.</>,
        image: ExampleIcon,
    },
    heldByTractorBeam: {
        name: 'Held by Tractor Beam',
        description: <>Another ship has this one in its tractor beam, heavily slowing every manoeuvre started. The beam breaks if the ships get too far apart, or if this ship starts a manoeuvre with more power at its helm, plus its Momentum, than the holder has at its tactical.</>,
        image: ExampleIcon,
    },
    tractorBeamEngaged: {
        name: 'Tractor Beam Engaged',
        description: <>This ship is holding another in its tractor beam, slowing every manoeuvre it starts as it tows. The beam breaks if the ships get too far apart.</>,
        image: ExampleIcon,
    },
});

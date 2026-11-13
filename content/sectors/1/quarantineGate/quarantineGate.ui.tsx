import { defineUiContent } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { CardDescription } from 'common-ui/features/cards/types/UICardDefinition';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { quarantineGateShared } from './quarantineGate.shared';

// Every station's Shutdown Key reads the same: whose it is goes without saying.
const shutdownKey: CardDescription = {
    name: 'Shutdown Key',
    description: <>
        <Trait trait="priority" />
        {' '}
        Turn your key. It stays turned for
        {' '}
        <Parameter name="duration" />
        {' '}
        seconds.
    </>,
    image: <ExampleIcon />,
};

export const quarantineGateUi = defineUiContent({
    shared: quarantineGateShared,
    cards: {
        shutdownKeyHelm: shutdownKey,
        shutdownKeyScience: shutdownKey,
        shutdownKeyTactical: shutdownKey,
        shutdownKeyEngineer: shutdownKey,
        keyPower: {
            name: 'Key Power',
            description: <>
                <Trait trait="priority" />
                {' '}
                Increase a system's power level by
                {' '}
                <Parameter name="powerGain" />
                {' '}
                for
                {' '}
                <Parameter name="duration" />
                {' '}
                seconds. Every system can have it at once.
            </>,
            image: <ExampleIcon />,
        },
    },
    effects: {
        keyPower: {
            name: 'Key Power',
            description: <>This system is running a level higher for a while, enough to turn its Shutdown Key.</>,
            image: ExampleIcon,
        },
        gatePulse: {
            name: 'Gate Pulse',
            description: <>A pulse from the quarantine gate has passed through this system. It does no harm.</>,
            image: ExampleIcon,
        },
        keyTurned: {
            name: 'Key Turned',
            description: <>This station's Shutdown Key is turned. It turns back on its own.</>,
            image: ExampleIcon,
        },
    },
});

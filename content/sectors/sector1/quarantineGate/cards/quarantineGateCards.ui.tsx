import { defineUiCards } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { CardDescription } from 'common-ui/features/cards/types/UICardDefinition';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { cards as sharedCards } from './quarantineGateCards.shared';

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

export const cards = defineUiCards(sharedCards, {
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
});

import { defineUiCards } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { CardDescription } from 'common-ui/features/cards/types/UICardDefinition';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { cards as sharedCards } from './weaponTraitsCards.shared';

// Every station's Disrupted card reads the same: whose system it damages goes without saying.
const disrupted: CardDescription = {
    name: 'Disrupted',
    description: <>
        <Trait trait="expendable" />
        {' '}
        <Trait trait="priority" />
        {' '}
        Left by a disrupting weapon. Playing it deals
        {' '}
        <Parameter name="damage" />
        {' '}
        damage to your system.
    </>,
    image: <ExampleIcon />,
};

export const cards = defineUiCards(sharedCards, {
    disruptedHelm: disrupted,
    disruptedScience: disrupted,
    disruptedTactical: disrupted,
    disruptedEngineer: disrupted,
});

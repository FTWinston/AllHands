import { FC } from 'react';
import { CardCompendiumDisplay } from './components/CardCompendiumDisplay';
import { useKnownCardTypes } from './hooks/useKnownCardTypes';

type Props = {
    back: () => void;
};

/** The card compendium: every card type seen on this device, across all games. */
export const CardCompendium: FC<Props> = (props) => {
    const known = useKnownCardTypes();

    return <CardCompendiumDisplay known={known} back={props.back} />;
};

import { FC } from 'react';
import { KnownCardsDisplay } from './components/KnownCardsDisplay';
import { useKnownCardTypes } from './knownCardStorage';

type Props = {
    back: () => void;
};

/** The known cards compendium: every card type seen on this device, across all games. */
export const KnownCards: FC<Props> = (props) => {
    const known = useKnownCardTypes();

    return <KnownCardsDisplay known={known} back={props.back} />;
};

import { NonEncounterCardInfo } from 'common-data/features/cards/types/NonEncounterCardInfo';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { DragCardProvider } from 'src/features/cardui/components/DragCardProvider';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import styles from './NonEncounterDisplay.module.css';
import { NonEncounterHand } from './NonEncounterHand';
import type { Snapshot } from '@colyseus/react';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'handSize'> & {
    /** Cards to offer instead of the crew's usual display; none for crew that only wait on the sector map. */
    cards?: Snapshot<NonEncounterCardInfo[]>;
    playCard?: (cardId: number) => void;
};

const noCards: Snapshot<NonEncounterCardInfo[]> = [];

/** Replaces a crew's display outside of an encounter: a plain background with the usual header, and any cards on offer. */
export const NonEncounterDisplay = (props: Props) => {
    const { cards = noCards, playCard, ...headerProps } = props;

    useRootClassName(crewStyles[headerProps.crew]);

    return (
        <Screen className={styles.screen}>
            <DragCardProvider onCardDropped={cardId => playCard?.(cardId)}>
                <CardDropTarget id="noTarget" targetType="no-target" />

                <CrewHeader {...headerProps} />

                <NonEncounterHand cards={cards} system={headerProps.crew} />
            </DragCardProvider>
        </Screen>
    );
};

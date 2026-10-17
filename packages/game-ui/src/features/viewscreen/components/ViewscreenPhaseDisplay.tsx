import { Screen } from 'common-ui/components/Screen';
import { FC, PropsWithChildren } from 'react';
import { GameEndedDisplay } from './GameEndedDisplay';
import { SectorMessageDisplay } from './SectorMessageDisplay';
import { ViewscreenMenuButton } from './ViewscreenMenuButton';
import styles from './ViewscreenPhaseDisplay.module.css';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';

type Props = PropsWithChildren<{
    phase: GamePhase | null;
    /** When the game is over, whatever the phase was, the outcome is shown instead. */
    isEnded?: boolean;
    outcome: GameOutcome | null;
    message: SectorMessageInfo | null;
    showMenu: () => void;
}>;

export const ViewscreenPhaseDisplay: FC<Props> = ({ phase, isEnded, outcome, message, showMenu, children }) => {
    let content;
    if (isEnded) {
        content = <GameEndedDisplay outcome={outcome} message={message} />;
    } else if ((phase === 'sectorIntro' || phase === 'sectorOutro') && message) {
        content = <SectorMessageDisplay message={message} />;
    } else {
        content = <p className={styles.placeholder} role="status">Preparing...</p>;
    }

    return (
        <Screen>
            <ViewscreenMenuButton showMenu={showMenu} />
            {content}
            {children}
        </Screen>
    );
};

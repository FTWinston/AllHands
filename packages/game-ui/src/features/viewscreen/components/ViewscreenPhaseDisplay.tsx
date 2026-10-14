import { Screen } from 'common-ui/components/Screen';
import { FC, PropsWithChildren } from 'react';
import { GameEndedDisplay } from './GameEndedDisplay';
import { SectorMapDisplay } from './SectorMapDisplay';
import { SectorMessageDisplay } from './SectorMessageDisplay';
import { ViewscreenMenuButton } from './ViewscreenMenuButton';
import styles from './ViewscreenPhaseDisplay.module.css';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMapInfo, SectorMessageInfo } from 'common-data/features/sectors/types/SectorMapInfo';

type Props = PropsWithChildren<{
    phase: Exclude<GamePhase, 'encounter'>;
    outcome: GameOutcome | null;
    map: SectorMapInfo | null;
    message: SectorMessageInfo | null;
    showMenu: () => void;
}>;

export const ViewscreenPhaseDisplay: FC<Props> = ({ phase, outcome, map, message, showMenu, children }) => {
    let content;
    if (phase === 'ended') {
        content = <GameEndedDisplay outcome={outcome} />;
    } else if (phase === 'map' && map) {
        content = <SectorMapDisplay map={map} />;
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

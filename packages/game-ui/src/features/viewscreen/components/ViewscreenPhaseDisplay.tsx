import { Screen } from 'common-ui/components/Screen';
import { FC, PropsWithChildren } from 'react';
import { AntimatterDisplay } from './AntimatterDisplay';
import { GameEndedDisplay } from './GameEndedDisplay';
import { SectorMapDisplay } from './SectorMapDisplay';
import { SectorMessageDisplay } from './SectorMessageDisplay';
import { ViewscreenMenuButton } from './ViewscreenMenuButton';
import styles from './ViewscreenPhaseDisplay.module.css';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMapInfo } from 'common-data/features/sectors/types/SectorMapInfo';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';

type Props = PropsWithChildren<{
    phase: GamePhase | null;
    /** When the game is over, whatever the phase was, the outcome is shown instead. */
    isEnded?: boolean;
    outcome: GameOutcome | null;
    map: SectorMapInfo | null;
    message: SectorMessageInfo | null;
    /** The ship's antimatter, shown alongside the sector map. Omitted when unknown. */
    antimatter?: number;
    showMenu: () => void;
}>;

export const ViewscreenPhaseDisplay: FC<Props> = ({ phase, isEnded, outcome, map, message, antimatter, showMenu, children }) => {
    let content;
    if (isEnded) {
        content = <GameEndedDisplay outcome={outcome} message={message} />;
    } else if (phase === 'map' && map) {
        content = (
            <>
                <SectorMapDisplay map={map} />
                {antimatter !== undefined && <AntimatterDisplay antimatter={antimatter} />}
            </>
        );
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

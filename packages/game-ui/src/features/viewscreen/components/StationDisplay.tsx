import { getNodeKindLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { FC, PropsWithChildren } from 'react';
import { SceneTopBar } from './SceneTopBar';
import styles from './StationDisplay.module.css';
import type { StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';

type Props = PropsWithChildren<{
    kind: StationKind;
    name: string;
    /** The ship's antimatter, to spend at the station. Omitted when unknown. */
    antimatter?: number;
    showMenu?: () => void;
}>;

/** The viewscreen while the ship is docked at a station, instead of the space view. */
export const StationDisplay: FC<Props> = ({ kind, name, antimatter, showMenu, children }) => (
    <section className={styles.root} aria-label={`Docked at ${name}: ${getNodeKindLabel(kind)}`}>
        <SceneTopBar
            subtitle={getNodeKindLabel(kind)}
            title={name}
            antimatter={antimatter}
            showMenu={showMenu}
        />
        {/* TODO: show something of the station here. */}
        <div className={styles.body} />
        {children}
    </section>
);

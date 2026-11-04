import { getShopRole } from 'common-data/features/sectors/utils/isStationKind';
import crewStyles from 'common-ui/CrewColors.module.css';
import { getNodeKindLabel, getShopLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { FC, PropsWithChildren } from 'react';
import { ChaseLights } from 'src/components/ChaseLights';
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

/** The viewscreen while the ship is docked at a station, instead of the space view. A shop is shown in the colours of the crew member it sells to. */
export const StationDisplay: FC<Props> = ({ kind, name, antimatter, showMenu, children }) => {
    const shopRole = getShopRole(kind);
    const shop = getShopLabel(kind);

    return (
        <section
            className={classNames(styles.root, shopRole ? crewStyles[shopRole] : null, shopRole ? styles.shop : null)}
            aria-label={`Docked at ${name}: ${getNodeKindLabel(kind)}`}
        >
            <SceneTopBar
                subtitle={shop ? `${getNodeKindLabel(kind)} · ${shop}` : getNodeKindLabel(kind)}
                title={name}
                icon={shopRole ? <SystemIcon system={shopRole} /> : undefined}
                antimatter={antimatter}
                showMenu={showMenu}
            />
            {/* TODO: show something of the station here. */}
            <div className={styles.body} />
            <ChaseLights />
            {children}
        </section>
    );
};

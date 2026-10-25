import { getNodeKindLabel, getShopLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { FC } from 'react';
import styles from './StationBanner.module.css';
import type { StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';

type Props = {
    kind: StationKind;
    name: string;
};

/** Which station the ship is docked at, what kind it is, and what (if anything) it sells. Shown at the top of the viewscreen. */
export const StationBanner: FC<Props> = ({ kind, name }) => {
    const shop = getShopLabel(kind);

    return (
        <div className={styles.banner} role="status" aria-label={`Docked at ${name}: ${getNodeKindLabel(kind)}`}>
            <span className={styles.kind}>{getNodeKindLabel(kind)}</span>
            <span className={styles.name}>{name}</span>
            <span className={styles.services}>
                {shop ? `Full repairs, and ${shop.toLowerCase()} for sale` : 'Full repairs'}
            </span>
        </div>
    );
};

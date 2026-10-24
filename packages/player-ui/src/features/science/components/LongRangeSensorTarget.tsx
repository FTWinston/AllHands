import { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';
import { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { RouteIcon } from 'common-ui/features/cards/components/RouteIcon';
import { getDestinationDetails } from 'common-ui/features/sectors/utils/getDestinationDetails';
import { getNodeKindLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { classNames } from 'common-ui/utils/classNames';
import { Fragment } from 'react';
import styles from './LongRangeSensorTarget.module.css';

type Props = SectorDestinationInfo & {
    targetNumber: number;
    totalTargets: number;
};

const kindPalettes: Record<SectorNodeKind, string> = {
    combat: colorPalettes.danger,
    repair: colorPalettes.good,
    navigationBeacon: colorPalettes.energy,
    weaponsDealer: colorPalettes.energy,
    engineeringOutpost: colorPalettes.energy,
    scienceStation: colorPalettes.energy,
    boss: colorPalettes.primary,
};

/** A destination as seen by long range sensors: laid out like a science target, revealing what the node holds. */
export const LongRangeSensorTarget = (props: Props) => (
    <div className={classNames(styles.rootOuter, kindPalettes[props.kind])}>
        <div className={styles.rootInner}>
            <h2 className={styles.name}>{props.name}</h2>

            <div className={styles.count}>
                #
                {' '}
                {props.targetNumber}
                {' '}
                /
                {' '}
                {props.totalTargets}
            </div>

            <div className={styles.image}>
                <RouteIcon nodeKind={props.kind} />
            </div>

            <dl className={styles.details}>
                <dt>Type</dt>
                <dd>{getNodeKindLabel(props.kind, props.elite)}</dd>
                {getDestinationDetails(props).map(detail => (
                    <Fragment key={detail.label}>
                        <dt>{detail.label}</dt>
                        <dd>{detail.value}</dd>
                    </Fragment>
                ))}
            </dl>
        </div>
    </div>
);

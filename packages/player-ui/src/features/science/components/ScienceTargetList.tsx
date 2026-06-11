import { IArray } from '@colyseus/react';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { ScienceTarget } from './ScienceTarget';
import styles from './ScienceTargetList.module.css';

type Props = {
    targets: IArray<GameObjectInfo>;
    scannedShipId: string | null;
};

export const ScienceTargetList = (props: Props) => {
    const { targets, scannedShipId } = props;

    // TODO: get scanned slot info passed here from Science -> ScienceDisplay, and match it up with scannedShipId to determine which ScienceTarget to show it on.

    return (
        <HorizontalScroll
            className={styles.scrollArea}
            contentClassName={styles.content}
            contentRender={<ul />}
            snap={true}
        >
            {targets.map((target, index) => (
                <li className={styles.itemWrapper} key={target.id}>
                    <ScienceTarget
                        id={target.id}
                        name={target.name}
                        appearance={target.appearance}
                        relationship={target.relationship}
                        motion={target.motion}
                        targetNumber={index + 1}
                        totalTargets={targets.length}
                    />
                </li>
            ))}
        </HorizontalScroll>
    );
};

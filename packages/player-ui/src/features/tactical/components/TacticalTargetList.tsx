import { IArray } from '@colyseus/react';
import { GameObjectInfo, RelationshipViewer, TargetSubTargets } from 'common-data/features/space/types/GameObjectInfo';
import { getDisplayRelationship } from 'common-data/features/space/utils/getDisplayRelationship';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { TacticalTarget } from './TacticalTarget';
import styles from './TacticalTargetList.module.css';

type Props = {
    targets: IArray<GameObjectInfo>;
    subTargetsByTarget: Record<string, TargetSubTargets>;
    onVisibleTargetChange: (target: GameObjectInfo) => void;
    targetAspect?: number;
    viewer: RelationshipViewer;
};

export const TacticalTargetList = (props: Props) => {
    const { targets, targetAspect, subTargetsByTarget, onVisibleTargetChange, viewer } = props;

    // Handler for HorizontalScroll's onScrollFractionChange
    const handleScrollFractionChange = (fraction: number) => {
        if (!onVisibleTargetChange || targets.length === 0) {
            return;
        }

        // Clamp fraction to [0, 1]
        const clamped = Math.max(0, Math.min(1, fraction));
        // Compute index (round to nearest)
        const index = Math.round(clamped * (targets.length - 1));
        onVisibleTargetChange(targets[index]);
    };

    return (
        <HorizontalScroll
            className={styles.scrollArea}
            contentClassName={styles.content}
            contentRender={<ul />}
            snap={true}
            onScrollFractionChange={handleScrollFractionChange}
        >
            {targets.map((target, index) => (
                <li className={styles.itemWrapper} key={target.id}>
                    <TacticalTarget
                        id={target.id}
                        name={target.name}
                        appearance={target.appearance}
                        faction={target.faction}
                        relationship={getDisplayRelationship(target, viewer)}
                        motion={target.motion}
                        subTargets={subTargetsByTarget[target.id]?.subTargets}
                        targetNumber={index + 1}
                        targetAspect={targetAspect}
                        totalTargets={targets.length}
                    />
                </li>
            ))}
        </HorizontalScroll>
    );
};

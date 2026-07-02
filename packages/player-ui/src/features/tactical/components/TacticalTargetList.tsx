import { IArray } from '@colyseus/react';
import { GameObjectInfo, TargetSubTargets } from 'common-data/features/space/types/GameObjectInfo';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { TacticalTarget } from './TacticalTarget';
import styles from './TacticalTargetList.module.css';

type Props = {
    targets: IArray<GameObjectInfo>;
    subTargetsByTarget: Record<string, TargetSubTargets>;
    onVisibleTargetChange: (target: GameObjectInfo) => void;
    targetAspect?: number;
};

export const TacticalTargetList = (props: Props) => {
    const { targets, targetAspect, subTargetsByTarget, onVisibleTargetChange } = props;

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
                        relationship={target.relationship}
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

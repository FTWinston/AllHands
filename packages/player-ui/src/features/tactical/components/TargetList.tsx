import { TacticalTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { Target } from './Target';
import styles from './TargetList.module.css';

type Props = {
    targets: MinimalReadonlyArray<TacticalTargetInfo>;
    onVisibleTargetChange: (target: TacticalTargetInfo) => void;
};

export const TargetList = (props: Props) => {
    const { targets, onVisibleTargetChange } = props;

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
                    <Target
                        id={target.id}
                        name={target.name}
                        appearance={target.appearance}
                        vulnerabilities={target.vulnerabilities}
                        targetNumber={index + 1}
                        totalTargets={targets.length}
                    />
                </li>
            ))}
        </HorizontalScroll>
    );
};

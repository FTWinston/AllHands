import { Vulnerability } from 'common-data/features/ships/types/Vulnerability';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { Target, TargetInfo } from './Target';
import styles from './TargetList.module.css';

export type ListTargetInfo = TargetInfo & {
    slotNoFireReasons: Array<string | null>; // TODO: type this
};

type Props = {
    targets: ListTargetInfo[];
    visibleTarget: ListTargetInfo | null;
    onVisibleTargetChange: (target: ListTargetInfo) => void;
    selectedVulnerability: Vulnerability | null;
    onSelectVulnerability: (vulnerability: Vulnerability | null) => void;
};

export const TargetList = (props: Props) => {
    const { targets, visibleTarget, onVisibleTargetChange } = props;

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
                        appearance={target.appearance}
                        vulnerabilities={target.vulnerabilities}
                        selectedVulnerability={target === visibleTarget ? props.selectedVulnerability : null}
                        selectVulnerability={target === visibleTarget ? props.onSelectVulnerability : undefined}
                        targetNumber={index + 1}
                        totalTargets={targets.length}
                    />
                </li>
            ))}
        </HorizontalScroll>
    );
};

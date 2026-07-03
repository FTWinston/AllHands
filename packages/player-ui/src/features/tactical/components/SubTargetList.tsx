import { IArray } from '@colyseus/react';
import { SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { isFacingSubTarget } from 'common-data/features/space/utils/isFacingSubTarget';
import { classNames } from 'common-ui/utils/classNames';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import { SubTargetIndicator } from './SubTargetIndicator';
import styles from './SubTargetList.module.css';

type Props = {
    className?: string;
    subTargets: IArray<SubTargetInfo>;
    targetId: string;
    targetAspect?: number;
};

const getSubTargetId = (subTarget: SubTargetInfo) => subTarget.id;

export const SubTargetList = (props: Props) => {
    const { knownItems, currentItemIds, removingItemIds } = useArrayChanges(props.subTargets, getSubTargetId);

    return (
        <div
            className={classNames(styles.list, props.className)}
            // @ts-expect-error CSS custom property
            style={{ '--count': knownItems.length }}
        >
            {knownItems.map((subTarget, index) => {
                const invalidAngle = props.targetAspect !== undefined
                    && !isFacingSubTarget(props.targetAspect, subTarget);

                return (
                    <SubTargetIndicator
                        key={subTarget.id}
                        index={index}
                        targetId={props.targetId}
                        subTarget={subTarget}
                        disabled={invalidAngle}
                        hidden={removingItemIds.has(subTarget.id) || !currentItemIds.has(subTarget.id)}
                    />
                );
            })}
        </div>
    );
};

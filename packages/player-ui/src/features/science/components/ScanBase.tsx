import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ObjectId } from 'common-data/features/space/types/GameObjectInfo';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    className?: string;
    targetId: ObjectId;
    system: CrewRoleName;
}>;

export const ScanBase = (props: Props) => {
    const id = `target/${props.targetId}/${props.system}`;

    return (
        <CardDropTarget
            targetType="scan"
            id={id}
            className={classNames(styles.root, props.className)}
        >
            {props.children}
        </CardDropTarget>
    );
};

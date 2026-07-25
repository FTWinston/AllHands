import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ObjectId } from 'common-data/features/space/types/GameObjectInfo';
import { Button } from 'common-ui/components/Button';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    contentClassName?: string;
    targetId: ObjectId;
    system: CrewRoleName;
    close?: () => void;
}>;

export const ScanBase = (props: Props) => {
    const id = `target/${props.targetId}/${props.system}`;

    // TODO: show name and a "close" button at the top here.

    return (
        <CardDropTarget
            targetType="scan"
            id={id}
            className={styles.root}
        >
            <h2 className={styles.header}>
                {props.system}
            </h2>
            <Button className={styles.closeButton} onClick={props.close}>
                ✕
            </Button>
            <div className={classNames(styles.content, props.contentClassName)}>
                {props.children}
            </div>
        </CardDropTarget>
    );
};

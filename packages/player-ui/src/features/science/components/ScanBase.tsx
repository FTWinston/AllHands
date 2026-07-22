import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    className?: string;
    expanded: boolean;
    id: string;
}>;

export const ScanBase = (props: Props) => {
    return (
        <CardDropTarget
            targetType="scan"
            id={props.id}
            render="li"
            className={classNames(styles.root, props.expanded ? styles.expanded : styles.contracted, props.className)}
        >
            {props.children}
        </CardDropTarget>
    );
};

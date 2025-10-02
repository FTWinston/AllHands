import { classNames } from 'common-ui/classNames';
import { FC, PropsWithChildren, useContext, useState } from 'react';
import { ActiveCardContext } from './ActiveCardProvider';
import styles from './CardDropTarget.module.css';

type Props = PropsWithChildren<{
    className?: string;
    onCardDropped: (cardID: number) => void;
    targetType?: string;
}>;

export const CardDropTarget: FC<Props> = (props) => {
    const [dropping, setDropping] = useState(false);
    const activeCard = useContext(ActiveCardContext);

    const matchesActiveCardTargetType = activeCard && (!props.targetType || props.targetType === activeCard.targetType);
    const canDropHere = dropping && matchesActiveCardTargetType;
    const couldDropHere = !dropping && matchesActiveCardTargetType;

    return (
        <div
            className={classNames(canDropHere ? styles.dropping : null, couldDropHere ? styles.couldDrop : null, props.className)}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = matchesActiveCardTargetType ? 'move' : 'none';
                setDropping(true);
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'none';
                setDropping(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setDropping(false);

                if (matchesActiveCardTargetType) {
                    props.onCardDropped(activeCard.id);
                }
            }}
        >
            {props.children}
        </div>
    );
};

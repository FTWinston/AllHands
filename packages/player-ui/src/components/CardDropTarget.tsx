import { classNames } from 'common-ui/classNames';
import styles from './CardDropTarget.module.css'
import { useContext, useState } from 'react';
import { ActiveCardTargetTypeContext } from './ActiveCardTargetTypeProvider';

type Props = React.PropsWithChildren<{
    className?: string;
    onCardDropped: (cardID: number) => void;
    targetType?: string;
}>

export const CardDropTarget: React.FC<Props> = (props) => {
    const [dropping, setDropping] = useState(false);
    const draggingCardType = useContext(ActiveCardTargetTypeContext);

    const matchesActiveCardTargetType = !props.targetType || props.targetType === draggingCardType;

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
            onDragLeave={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'none';
                setDropping(false);
            }}
            onDrop={e => {
                e.preventDefault();
                setDropping(false);

                if (matchesActiveCardTargetType) {
                    const cardID = parseInt(e.dataTransfer.getData('text/card'), 10);
                    props.onCardDropped(cardID);
                }
            }}
        >
            {props.children}
        </div>
    );
}

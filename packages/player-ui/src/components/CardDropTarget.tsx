import { classNames } from 'common-ui/classNames';
import styles from './CardDropTarget.module.css'
import { useState } from 'react';

type Props = React.PropsWithChildren<{
    className?: string;
    droppedCard: (cardID: number) => void;
    targetId: string;
}>

export const CardDropTarget: React.FC<Props> = (props) => {
    const [dropping, setDropping] = useState(false);

    return (
        <div
            className={classNames(dropping ? styles.dropping : null, props.className)}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDropping(true);
            }}
            onDragLeave={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'none';
                setDropping(false);
            }}

            onDrop={e => {
                e.preventDefault();
                const cardID = parseInt(e.dataTransfer.getData('text/card'), 10);
                props.droppedCard(cardID);
                setDropping(false);
            }}
        >
            {props.children}
        </div>
    );
}

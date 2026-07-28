import { Popover } from '@base-ui-components/react/popover';
import { FC, JSX, PropsWithChildren, RefObject } from 'react';
import { classNames } from '../utils/classNames';
import styles from './Popup.module.css';

type Props = PropsWithChildren<{
    name?: string;
    description: JSX.Element;
    anchor?: RefObject<Element | null>;
}>;

/**
 * A popup display that must be rendered within a Popover.Root component.
 * Needs either a Popover.Trigger, or an anchor ref for positioning.
 */
export const Popup: FC<Props> = (props) => {
    return (
        <Popover.Portal>
            <Popover.Backdrop className={styles.backdrop} />
            <Popover.Positioner sideOffset={8} anchor={props.anchor}>
                <Popover.Popup className={classNames(styles.popup)}>
                    <Popover.Arrow className={styles.arrow} />
                    {props.name && <Popover.Title className={styles.name}>{props.name}</Popover.Title>}
                    <Popover.Description className={styles.description}>
                        {props.description}
                    </Popover.Description>
                </Popover.Popup>
            </Popover.Positioner>
        </Popover.Portal>
    );
};

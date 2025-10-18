import { Popover } from '@base-ui-components/react/popover';
import { FC, PropsWithChildren } from 'react';
import { classNames } from './classNames';
import styles from './InfoPopup.module.css';

type Props = PropsWithChildren<{
    className?: string;
    name: string;
    description: string;
}>;

export const InfoPopup: FC<Props> = props => (
    <Popover.Root>
        <Popover.Trigger className={classNames(styles.item, props.className)}>
            {props.children}
        </Popover.Trigger>
        <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
                <Popover.Popup className={styles.popup}>
                    <Popover.Arrow className={styles.arrow} />
                    <Popover.Title className={styles.name}>{props.name}</Popover.Title>
                    <Popover.Description className={styles.description}>
                        {props.description}
                    </Popover.Description>
                </Popover.Popup>
            </Popover.Positioner>
        </Popover.Portal>
    </Popover.Root>
);

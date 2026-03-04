import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { FC, PropsWithChildren } from 'react';
import { classNames } from '../utils/classNames';
import styles from './Dialog.module.css';

type Props = PropsWithChildren<{
    title: string;
    prompt: string;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    className?: string;
}>;

export const Dialog: FC<Props> = props => (
    <BaseDialog.Root open={props.isOpen} onOpenChange={props.setOpen}>
        <BaseDialog.Portal>
            <BaseDialog.Backdrop className={styles.backdrop} />
            <BaseDialog.Popup className={classNames(styles.popup, props.className)}>
                {props.title && <BaseDialog.Title className={styles.title}>{props.title}</BaseDialog.Title>}
                {props.prompt && (
                    <BaseDialog.Description className={styles.description}>
                        {props.prompt}
                    </BaseDialog.Description>
                )}
                {props.children}
            </BaseDialog.Popup>
        </BaseDialog.Portal>
    </BaseDialog.Root>
);

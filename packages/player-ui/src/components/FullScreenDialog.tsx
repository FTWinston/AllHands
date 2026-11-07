import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Button } from 'common-ui/components/Button';
import { default as CloseIcon } from 'common-ui/icons/close.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC, PropsWithChildren } from 'react';
import styles from './FullScreenDialog.module.css';

type Props = PropsWithChildren<{
    title: string;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    /** Leave out the close button, when something else closes it, e.g. a toggle button in the crew header. */
    noCloseButton?: boolean;
    /** Applied to the scrolling area that holds the children. */
    bodyClassName?: string;
}>;

/**
 * A dialog covering the screen below the crew header, with its title beneath that, and a vertically scrolling body.
 * It isn't modal, so the crew header stays usable, e.g. to toggle this dialog with a button there.
 */
export const FullScreenDialog: FC<Props> = props => (
    // Presses outside shouldn't close it: a button that opens it would otherwise count as one, closing it straight away.
    <BaseDialog.Root open={props.isOpen} onOpenChange={props.setOpen} modal={false} disablePointerDismissal>
        <BaseDialog.Portal>
            <BaseDialog.Popup className={styles.popup}>
                <header className={styles.header}>
                    <BaseDialog.Title className={styles.title}>{props.title}</BaseDialog.Title>

                    {!props.noCloseButton && (
                        <BaseDialog.Close
                            render={(
                                <Button title="Close" aria-label="Close" icon={<CloseIcon className={styles.closeIcon} />} />
                            )}
                        />
                    )}
                </header>

                <div className={classNames(styles.body, props.bodyClassName)}>
                    {props.children}
                </div>
            </BaseDialog.Popup>
        </BaseDialog.Portal>
    </BaseDialog.Root>
);

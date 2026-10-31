import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Button } from 'common-ui/components/Button';
import { default as CloseIcon } from 'common-ui/icons/close.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC, PropsWithChildren, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './FullScreenDialog.module.css';

type Props = PropsWithChildren<{
    title: string;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    /** Applied to the scrolling area that holds the children. */
    bodyClassName?: string;
}>;

/** Marks the element in the crew header that a full-screen dialog's title and close button are shown in, while it's open. */
export const dialogHeaderSlotAttribute = 'data-dialog-header-slot';

/**
 * A dialog covering the screen below the crew header, with a vertically scrolling body. Its title and close button are shown in the crew header itself.
 * It isn't modal, so the crew header stays usable, e.g. to toggle this dialog with a button there.
 */
export const FullScreenDialog: FC<Props> = (props) => {
    // Every element is in the document by the time layout effects run, so the crew header's slot can be found here.
    const [headerSlot, setHeaderSlot] = useState<Element | null>(null);
    useLayoutEffect(() => setHeaderSlot(document.querySelector(`[${dialogHeaderSlotAttribute}]`)), []);

    const header = (
        <>
            <BaseDialog.Title className={styles.title}>{props.title}</BaseDialog.Title>
            <BaseDialog.Close
                render={(
                    <Button className={styles.close} title="Close" aria-label="Close">
                        <CloseIcon className={styles.closeIcon} />
                    </Button>
                )}
            />
        </>
    );

    return (
        // Presses outside shouldn't close it: a button that opens it would otherwise count as one, closing it straight away.
        <BaseDialog.Root open={props.isOpen} onOpenChange={props.setOpen} modal={false} disablePointerDismissal>
            <BaseDialog.Portal>
                <BaseDialog.Popup className={styles.popup}>
                    {/* Without a crew header, e.g. in a story, the dialog shows its own. */}
                    {headerSlot
                        ? createPortal(header, headerSlot)
                        : <header className={styles.header}>{header}</header>}

                    <div className={classNames(styles.body, props.bodyClassName)}>
                        {props.children}
                    </div>
                </BaseDialog.Popup>
            </BaseDialog.Portal>
        </BaseDialog.Root>
    );
};

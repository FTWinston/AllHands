import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { FC, PropsWithChildren, ReactNode } from 'react';
import { classNames } from '../utils/classNames';
import { Button } from './Button';
import styles from './FullScreenDialog.module.css';

type Props = PropsWithChildren<{
    title: string;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    /** Shown before the title, e.g. an icon. */
    headerStart?: ReactNode;
    /** Shown after the title, before the close button. */
    headerEnd?: ReactNode;
    /** Applied to the header, which holds the title and close button. */
    headerClassName?: string;
    /** Applied to the scrolling area beneath the header, which holds the children. */
    bodyClassName?: string;
}>;

/** A modal covering the whole screen, with a header holding its title and a close button, and a vertically scrolling body. */
export const FullScreenDialog: FC<Props> = props => (
    // There's no "outside" to press, but a button that opens this would otherwise count as one, closing it straight away.
    <BaseDialog.Root open={props.isOpen} onOpenChange={props.setOpen} disablePointerDismissal>
        <BaseDialog.Portal>
            <BaseDialog.Popup className={styles.popup}>
                <header className={classNames(styles.header, props.headerClassName)}>
                    {props.headerStart}

                    <BaseDialog.Title className={styles.title}>{props.title}</BaseDialog.Title>

                    {props.headerEnd}

                    <BaseDialog.Close render={<Button>Close</Button>} />
                </header>

                <div className={classNames(styles.body, props.bodyClassName)}>
                    {props.children}
                </div>
            </BaseDialog.Popup>
        </BaseDialog.Portal>
    </BaseDialog.Root>
);

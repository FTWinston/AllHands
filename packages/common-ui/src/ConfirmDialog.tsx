import { Dialog } from '@base-ui-components/react/dialog';

import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

type Props = {
    title: string;
    prompt: string;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    confirm: () => void;
};

export const ConfirmDialog: React.FC<Props> = (props) => (
    <Dialog.Root open={props.isOpen} onOpenChange={props.setOpen}>
        <Dialog.Portal>
            <Dialog.Backdrop className={styles.backdrop} />
            <Dialog.Popup className={styles.popup}>
                <Dialog.Title className={styles.title}>{props.title}</Dialog.Title>
                <Dialog.Description className={styles.description}>
                    {props.prompt}
                </Dialog.Description>
                <div className={styles.actions}>
                    <Dialog.Close render={<Button>Cancel</Button>} />
                    <Button onClick={() => {
                        props.setOpen(false);
                        props.confirm();
                    }}>OK</Button>
                </div>
            </Dialog.Popup>
        </Dialog.Portal>
    </Dialog.Root>
);

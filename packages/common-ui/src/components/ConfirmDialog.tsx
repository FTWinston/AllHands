import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { FC } from 'react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';
import { Dialog } from './Dialog';

type Props = {
    title: string;
    prompt: string;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    confirm: () => void;
};

export const ConfirmDialog: FC<Props> = props => (
    <Dialog
        isOpen={props.isOpen}
        setOpen={props.setOpen}
        title={props.title}
        prompt={props.prompt}
    >
        <div className={styles.actions}>
            <BaseDialog.Close render={<Button>Cancel</Button>} />
            <Button onClick={() => {
                props.setOpen(false);
                props.confirm();
            }}
            >
                OK
            </Button>
        </div>
    </Dialog>
);

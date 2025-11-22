import { ConfirmDialog } from 'common-ui/components/ConfirmDialog';
import { FC, PropsWithChildren, useState } from 'react';

import styles from './MenuItem.module.css';

type Props = {
    text: string;
    onClick?: () => void;
    confirmPrompt?: string;
};

export const MenuItem: FC<PropsWithChildren<Props>> = (props) => {
    const [showingConfirm, setShowingConfirm] = useState(false);

    const buttonClick = props.confirmPrompt
        ? () => setShowingConfirm(true)
        : props.onClick;

    return (
        <li className={styles.menuItem}>
            <button
                className={styles.menuButton}
                onClick={buttonClick}
                disabled={!props.onClick}
            >
                {props.text}
            </button>
            {props.confirmPrompt && props.onClick && (
                <ConfirmDialog
                    title="Confirm"
                    prompt={props.confirmPrompt}
                    isOpen={showingConfirm}
                    setOpen={setShowingConfirm}
                    confirm={props.onClick}
                />
            )}
            {props.children && <div className={styles.childrenWrapper}>{props.children}</div>}
        </li>
    );
};

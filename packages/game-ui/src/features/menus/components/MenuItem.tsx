import { ConfirmDialog } from 'common-ui/components/ConfirmDialog';
import { classNames } from 'common-ui/utils/classNames';
import { FC, ReactNode, useState } from 'react';
import { ChevronIcon } from 'src/icons';
import styles from './MenuItem.module.css';

type Props = {
    text: string;
    /** A line under the text, saying more about what the item does. */
    description?: string;
    icon?: ReactNode;
    /** A primary item is the one most people want. A danger item is a small text button, set apart from the rest. */
    emphasis?: 'primary' | 'danger';
    onClick?: () => void;
    confirmPrompt?: string;
};

export const MenuItem: FC<Props> = (props) => {
    const [showingConfirm, setShowingConfirm] = useState(false);

    const buttonClick = props.confirmPrompt
        ? () => setShowingConfirm(true)
        : props.onClick;

    return (
        <li className={classNames(styles.menuItem, props.emphasis ? styles[props.emphasis] : null)}>
            <button
                className={styles.menuButton}
                onClick={buttonClick}
                disabled={!props.onClick}
            >
                {props.icon && <span className={styles.icon}>{props.icon}</span>}
                <span className={styles.label}>
                    <span className={styles.text}>{props.text}</span>
                    {props.description && <span className={styles.description}>{props.description}</span>}
                </span>
                {props.emphasis !== 'danger' && <ChevronIcon className={styles.chevron} aria-hidden="true" />}
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
        </li>
    );
};

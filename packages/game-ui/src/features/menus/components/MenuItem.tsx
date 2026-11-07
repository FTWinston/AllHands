import { ConfirmDialog } from 'common-ui/components/ConfirmDialog';
import { default as ChevronForwardIcon } from 'common-ui/icons/chevron-forward.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import styles from './MenuItem.module.css';

type Props = {
    text: string;
    /** Set this for an item that switches a setting on or off where it is, rather than going somewhere. It says which in place of a chevron. */
    toggledOn?: boolean;
    /** Its place in the menu, shown before the text like a console's numbered keys. */
    number?: number;
    /** A primary item is the one most people want. A danger item is a narrower button, set apart from the rest. */
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
                aria-pressed={props.toggledOn}
            >
                {props.number !== undefined && <span className={styles.number} aria-hidden="true">{String(props.number).padStart(2, '0')}</span>}
                <span className={styles.text}>{props.text}</span>
                {props.toggledOn === undefined
                    ? <ChevronForwardIcon className={styles.chevron} aria-hidden="true" />
                    : <span className={classNames(styles.toggleState, props.toggledOn ? styles.on : null)} aria-hidden="true">{props.toggledOn ? 'On' : 'Off'}</span>}
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

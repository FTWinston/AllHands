import { classNames } from 'common-ui/utils/classNames';
import styles from './ContactLabel.module.css';

type Props = {
    /** What the crew calls this contact, such as "Alpha". Nothing is shown without one. */
    label?: string;
    className?: string;
};

/** A contact's label as a chip, in capitals so it can be told at a glance and shouted. It goes beside the contact's name, which can be shared with other contacts. */
export const ContactLabel = ({ label, className }: Props) => (
    label ? <span className={classNames(styles.root, className)}>{label}</span> : null
);

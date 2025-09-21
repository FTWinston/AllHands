import styles from './Button.module.css';
import { classNames } from './classNames';

export type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    label: string;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
};

export const Button: React.FC<Props> = ({ label, className, type, startIcon, endIcon, ...props }) => (
    <button
        {...props}
        type={type ?? 'button'}
        className={classNames(styles.button, startIcon ? styles.hasStartIcon : null, endIcon ? styles.hasEndIcon : null, className)}
    >
        {startIcon && <span className={styles.icon}>{startIcon}</span>}
        <span className={styles.label}>
            {label}
        </span>
        {endIcon && <span className={styles.icon}>{endIcon}</span>}
    </button>
);

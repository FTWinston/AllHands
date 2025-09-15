import styles from './Button.module.css';
import { classNames } from './classNames';

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    label: string;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
};

export const Button: React.FC<Props> = ({ label, className, type, ...props }) => (
    <button
        {...props}
        type={type ?? 'button'}
        className={classNames(styles.button, className)}
    >
        {label}
    </button>
);

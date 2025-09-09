import styles from './Button.module.css';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    size: 'small' | 'medium' | 'large';
    appearance: 'primary' | 'secondary';
};

export const Button: React.FC<ButtonProps> = ({ label, ...props }) => (
    <button
        className={`${styles.button} ${styles[`button--${props.appearance}`]} ${styles[`button--${props.size}`]}`}
        {...props}
    >
        {label}
    </button>
);

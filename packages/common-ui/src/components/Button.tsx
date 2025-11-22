import { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import colorPalletes from '../ColorPalette.module.css';
import { ColorPalette } from '../types/ColorPalette';
import { classNames } from '../utils/classNames';
import styles from './Button.module.css';

export type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    palette?: ColorPalette;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
};

export const Button: FC<Props> = ({ children, className, type, startIcon, endIcon, palette, ...props }) => (
    <button
        {...props}
        type={type ?? 'button'}
        className={classNames(
            styles.button,
            startIcon ? styles.hasStartIcon : null,
            endIcon ? styles.hasEndIcon : null,
            colorPalletes[palette ?? 'primary'],
            className)}
    >
        {startIcon && <span className={styles.icon}>{startIcon}</span>}
        <span className={styles.label}>
            {children}
        </span>
        {endIcon && <span className={styles.icon}>{endIcon}</span>}
    </button>
);

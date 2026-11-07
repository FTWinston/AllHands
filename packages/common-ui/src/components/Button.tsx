import { Button as ButtonBase, ButtonProps } from '@base-ui/react/button';
import { FC, ReactNode } from 'react';
import colorPalletes from '../ColorPalette.module.css';
import { ColorPalette } from '../types/ColorPalette';
import { classNames } from '../utils/classNames';
import styles from './Button.module.css';

type CommonProps = Omit<ButtonProps, 'className'> & {
    className?: string;
    palette?: ColorPalette;
    /** Draw just a coloured outline, for an action that shouldn't stand out, such as disconnecting. */
    outlined?: boolean;
};

type LabelledProps = CommonProps & {
    icon?: never;
    ariaLabel?: never;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
};

/**
 * A square button showing only an icon, so it needs an ariaLabel to say what it does.
 * It's 2em across, with an icon half that, unless given a width and height through its className, or a size on the icon itself.
 */
type IconOnlyProps = Omit<CommonProps, 'aria-label'> & {
    icon: ReactNode;
    ariaLabel: string;
    children?: never;
    startIcon?: never;
    endIcon?: never;
};

export type Props = LabelledProps | IconOnlyProps;

export const Button: FC<Props> = ({ children, className, icon, ariaLabel, startIcon, endIcon, palette, outlined, ...props }) => (
    <ButtonBase
        aria-label={ariaLabel}
        {...props}
        className={classNames(
            styles.button,
            icon ? styles.iconOnly : null,
            outlined ? styles.outlined : null,
            startIcon ? styles.hasStartIcon : null,
            endIcon ? styles.hasEndIcon : null,
            colorPalletes[palette ?? 'primary'],
            className)}
    >
        {icon
            ? <span className={styles.iconOnlyIcon} aria-hidden="true">{icon}</span>
            : (
                <>
                    {startIcon && <span className={styles.icon}>{startIcon}</span>}
                    <span className={styles.label}>
                        {children}
                    </span>
                    {endIcon && <span className={styles.icon}>{endIcon}</span>}
                </>
            )}
    </ButtonBase>
);

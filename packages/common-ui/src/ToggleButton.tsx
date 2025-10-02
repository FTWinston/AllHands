import { Toggle } from '@base-ui-components/react/toggle';

import { FC } from 'react';
import { Button, Props as ButtonProps } from './Button';
import { classNames } from './classNames';
import styles from './ToggleButton.module.css';

type Props = Omit<ButtonProps, 'onClick' | 'type' | 'endIcon'> & {
    pressed: boolean;
    value?: string;
    onPressedChanged: (pressed: boolean) => void;
};

export const ToggleButton: FC<Props> = ({ children, pressed, onPressedChanged, ...props }) => (
    <Toggle
        pressed={pressed}
        onPressedChange={onPressedChanged}
        {...props}
        render={(props, state) => (
            <Button
                {...props}
                className={classNames(styles.toggle, state.pressed ? styles.pressed : styles.unpressed, props.className)}
                children={children}
                endIcon={state.pressed ? '✅' : <span className={styles.inactiveEndIcon}>☑️</span>}
            />
        )}
    />
);

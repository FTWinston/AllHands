import { Toggle } from '@base-ui-components/react/toggle';

import { Button } from './Button';
import { classNames } from './classNames';
import styles from './ToggleButton.module.css';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    pressed: boolean;
    value?: string;
    onPressedChanged: (pressed: boolean) => void;
};

export const ToggleButton: React.FC<Props> = ({ label, pressed, onPressedChanged, ...props }) => (
    <Toggle
        pressed={pressed}
        onPressedChange={onPressedChanged}
        {...props}
        render={(props, state) => (
            <Button {...props} className={classNames(styles.toggle, state.pressed ? styles.pressed : styles.unpressed)} label={label} />
        )}
    />
);

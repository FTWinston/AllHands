import { Button, classNames, ToggleButton } from 'common-ui';

import styles from './LobbyRole.module.css';

export type Props = {
    name: string;
    occupied: boolean;
    selected: boolean;
    onSelectionChange: (selected: boolean) => void;
};

export const LobbyRole: React.FC<Props> = (props) => {
    const unavailable = props.occupied && !props.selected;

    if (unavailable) {
        return (
            <Button
                className={styles.role}
                label={props.name}
                disabled
            />
        );
    }

    return (
        <ToggleButton
            className={classNames(styles.role, props.occupied && !props.selected ? styles.blocked : null)}
            disabled={props.occupied && !props.selected}
            label={props.name}
            pressed={props.selected}
            onPressedChanged={props.onSelectionChange}
        />
    );
};

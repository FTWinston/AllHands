import { Button } from 'common-ui/components/Button';
import { ToggleButton } from 'common-ui/components/ToggleButton';
import { classNames } from 'common-ui/utils/classNames';
import { FC, JSX } from 'react';

import styles from './LobbyRole.module.css';

export type Props = {
    icon?: JSX.Element;
    name: string;
    occupied: boolean;
    selected: boolean;
    onSelectionChange: (selected: boolean) => void;
};

export const LobbyRole: FC<Props> = (props) => {
    const unavailable = props.occupied && !props.selected;

    if (unavailable) {
        return (
            <Button
                className={styles.role}
                disabled
                startIcon={props.icon}
            >
                {props.name}
            </Button>
        );
    }

    return (
        <ToggleButton
            className={classNames(styles.role, props.occupied && !props.selected ? styles.blocked : null)}
            disabled={props.occupied && !props.selected}
            pressed={props.selected}
            onPressedChanged={props.onSelectionChange}
            startIcon={props.icon}
        >
            {props.name}
        </ToggleButton>
    );
};

import { Switch } from '@base-ui-components/react/switch';
import { handPriority, powerPriority, SystemPowerPriority } from 'common-data/features/space/types/GameObjectInfo';
import { Button } from 'common-ui/components/Button';
import { FC } from 'react';
import styles from './PrioritySwitch.module.css';

type Props = {
    priority: SystemPowerPriority;
    onChange: (priority: SystemPowerPriority) => void;
};

export const PrioritySwitch: FC<Props> = (props) => {
    return (
        <Switch.Root
            checked={props.priority === handPriority}
            onCheckedChange={(checked) => {
                props.onChange(checked ? handPriority : powerPriority);
            }}
            render={(
                <Button
                    className={styles.switchArrow}
                >
                    <span className={styles.text}>
                        Priority
                    </span>
                </Button>
            )}
        />
    );
};

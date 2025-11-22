import { Switch } from '@base-ui-components/react/switch';
import { Button } from 'common-ui/components/Button';
import { FC } from 'react';
import styles from './PrioritySwitch.module.css';

type Props = {
    priority: 'hand' | 'power';
    onChange: (priority: 'hand' | 'power') => void;
};

export const PrioritySwitch: FC<Props> = (props) => {
    return (
        <Switch.Root
            checked={props.priority === 'hand'}
            onCheckedChange={(checked) => {
                props.onChange(checked ? 'hand' : 'power');
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

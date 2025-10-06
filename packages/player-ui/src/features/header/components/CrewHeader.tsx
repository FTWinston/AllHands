import { Menu } from '@base-ui-components/react/menu';
import { CrewRoleName } from 'common-types';
import { Button } from 'common-ui/Button';
import { CrewIcon } from 'common-ui/icons/crew';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC } from 'react';
import { default as HandIcon } from '../assets/card-hand.svg?react';
import { default as PowerIcon } from '../assets/power.svg?react';
import styles from './CrewHeader.module.css';
import { CrewMenu } from './CrewMenu';
import { NumberIndicator } from './NumberIndicator';
import { PrioritySwitch } from './PrioritySwitch';

type Props = {
    crew: CrewRoleName;
    onPause: () => void;
    priority: 'hand' | 'power';
    setPriority: (priority: 'hand' | 'power') => void;
};

export const CrewHeader: FC<Props> = (props) => {
    return (
        <div className={styles.crewHeader}>
            <div className={styles.title}>
                <Menu.Root>
                    <Menu.Trigger
                        render={(
                            <Button className={styles.menuButton}>
                                <MenuIcon className={styles.menuButtonIcon} />
                            </Button>
                        )}
                    />
                    <CrewMenu onPause={props.onPause} />
                </Menu.Root>

                <CrewIcon crew={props.crew} className={styles.titleIcon} />
                <div className={styles.titleText}>
                    {props.crew}
                </div>
            </div>

            <NumberIndicator
                value={3}
                maxValue={5}
                icon={PowerIcon}
            />

            <PrioritySwitch
                priority={props.priority}
                onChange={props.setPriority}
            />

            <NumberIndicator
                value={4}
                maxValue={5}
                icon={HandIcon}
            />
        </div>
    );
};

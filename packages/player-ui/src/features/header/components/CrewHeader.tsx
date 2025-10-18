import { Menu } from '@base-ui-components/react/menu';
import { CrewRoleName } from 'common-types';
import { Button } from 'common-ui/Button';
import { CrewIcon } from 'common-ui/icons/crew';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC } from 'react';
import { Cooldown } from 'src/types/Cooldown';
import { default as HandIcon } from '../assets/card-hand.svg?react';
import { default as EnergyIcon } from '../assets/energy.svg?react';
import { default as HealthIcon } from '../assets/health.svg?react';
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
    power: number;
    maxPower: number;
    powerGeneration?: Cooldown;
    handSize: number;
    maxHandSize: number;
    cardGeneration?: Cooldown;
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
                value={props.power}
                valueIcon={EnergyIcon}
                valueName="Energy"
                valueDescription="The number of available energy points to spend on playing cards. Recharges up to the current power value over time."
                maxValue={props.maxPower}
                maxIcon={PowerIcon}
                maxName="Power"
                maxDescription="The maximum energy that this system can store, as controlled by the Engineer."
                generation={props.powerGeneration}
            />

            <PrioritySwitch
                priority={props.priority}
                onChange={props.setPriority}
            />

            <NumberIndicator
                value={props.handSize}
                valueIcon={HandIcon}
                valueName="Hand Size"
                valueDescription="The number of cards currently in your hand. Replenishes over time as new cards are drawn, up to the system health value."
                maxValue={props.maxHandSize}
                maxIcon={HealthIcon}
                maxName="System Health"
                maxDescription="The maximum number of cards that can be held in your hand, as controlled by the Engineer."
                generation={props.cardGeneration}
            />
        </div>
    );
};

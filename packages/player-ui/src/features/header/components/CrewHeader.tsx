import { Menu } from '@base-ui-components/react/menu';
import { Cooldown } from 'common-data/types/Cooldown';
import { CrewRoleName } from 'common-data/types/CrewRole';
import { Button } from 'common-ui/components/Button';
import { CrewIcon } from 'common-ui/icons/crew';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC } from 'react';
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
                            <Button className={styles.menuButton} title="Menu">
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
                maxValue={props.maxPower}
                maxIcon={PowerIcon}
                name="Energy & Power"
                description={(
                    <>
                        Energy
                        <EnergyIcon />
                        {' '}
                        is the number of available points to spend on playing cards. This recharges over time, up to the system power value
                        {' '}
                        <PowerIcon />
                        , which is controlled by the Engineer.
                    </>
                )}
                generation={props.powerGeneration}
            />

            <PrioritySwitch
                priority={props.priority}
                onChange={props.setPriority}
            />

            <NumberIndicator
                value={props.handSize}
                valueIcon={HandIcon}
                maxValue={props.maxHandSize}
                maxIcon={HealthIcon}
                name="Hand Size & Health"
                description={(
                    <>
                        The number of cards in your hand
                        {' '}
                        <HandIcon />
                        {' '}
                        increases over time, up to the system health value
                        {' '}
                        <HealthIcon />
                        , which is controlled by the Engineer.
                    </>
                )}
                generation={props.cardGeneration}
            />
        </div>
    );
};

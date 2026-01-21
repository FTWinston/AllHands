import { Menu } from '@base-ui-components/react/menu';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Cooldown } from 'common-data/types/Cooldown';
import { Button } from 'common-ui/components/Button';
import { CrewIcon } from 'common-ui/icons/crew';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC } from 'react';
import { default as HandIcon } from '../assets/card-hand.svg?react';
import { default as HealthIcon } from '../assets/health.svg?react';
import { default as PowerIcon } from '../assets/power.svg?react';
import styles from './CrewHeader.module.css';
import { CrewMenu } from './CrewMenu';
import { NumberIndicator } from './NumberIndicator';

type Props = {
    crew: CrewRoleName;
    onPause: () => void;
    power: number;
    handSize: number;
    maxHandSize: number;
    cardGeneration?: Cooldown | null;
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

            <div className={styles.indicators}>
                <NumberIndicator
                    value={props.power}
                    valueIcon={PowerIcon}
                    name="Power"
                    description={(
                        <>
                            You can play cards whose cost is not higher than this value. Power
                            {' '}
                            <PowerIcon />
                            {' '}
                            is not consumed by playing cards, and is controlled by the Engineer.
                        </>
                    )}
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
        </div>
    );
};

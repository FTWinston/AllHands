import { Menu } from '@base-ui-components/react/menu';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Cooldown } from 'common-data/types/Cooldown';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { Button } from 'common-ui/components/Button';
import { CrewIcon } from 'common-ui/icons/crew';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC } from 'react';
import { default as DiscardIcon } from '../assets/card-discard.svg?react';
import { default as DrawIcon } from '../assets/card-draw.svg?react';
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
    drawPileCards: MinimalReadonlyArray<CardInstance>;
    discardPileCards: MinimalReadonlyArray<CardInstance>;
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
                    icon={PowerIcon}
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
                    value={props.drawPileCards.length}
                    icon={DrawIcon}
                    name="Draw pile"
                    description={(
                        <>
                            Cards in your draw pile show here
                        </>
                    )}
                    generation={props.cardGeneration}
                />

                <NumberIndicator
                    value={props.handSize}
                    icon={HandIcon}
                    maxValue={props.maxHandSize}
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
                />

                <NumberIndicator
                    value={props.discardPileCards.length}
                    icon={DiscardIcon}
                    name="Discard pile"
                    description={(
                        <>
                            Cards in your discard pile show here
                        </>
                    )}
                />
            </div>
        </div>
    );
};

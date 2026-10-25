import { Menu } from '@base-ui/react/menu';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Cooldown } from 'common-data/types/Cooldown';
import { Button } from 'common-ui/components/Button';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { DeckView } from 'src/features/deck/components/DeckView';
import { DeckViewModel } from 'src/features/deck/types/DeckViewModel';
import { default as DrawIcon } from '../assets/card-draw.svg?react';
import { default as PowerIcon } from '../assets/power.svg?react';
import styles from './CrewHeader.module.css';
import { CrewMenu } from './CrewMenu';
import { NumberIndicator } from './NumberIndicator';

type Props = {
    crew: CrewRoleName;
    onPause: () => void;
    /** Omitted outside an encounter, where no cards cost power. */
    power?: number;
    deckSize: number;
    cardGeneration?: Cooldown | null;
    /** Outside an encounter, the deck indicator becomes a button that opens this "my deck" view. During one, it is a discard target. */
    deckView?: DeckViewModel | null;
};

export const CrewHeader: FC<Props> = (props) => {
    return (
        <div className={styles.crewHeader} data-crew-header>
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

                <SystemIcon system={props.crew} className={styles.titleIcon} />
                <div className={styles.titleText}>
                    {props.crew}
                </div>
            </div>

            <div className={styles.indicators}>
                {props.power !== undefined && (
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
                )}

                {props.deckView
                    ? (
                        <Button
                            className={classNames(styles.deckButton, props.deckView.isOpen ? styles.deckButtonPressed : null)}
                            aria-pressed={props.deckView.isOpen}
                            title="My deck"
                            aria-label={`My deck: ${props.deckSize} cards`}
                            onClick={() => props.deckView!.setOpen(!props.deckView!.isOpen)}
                        >
                            <DrawIcon className={styles.deckButtonIcon} />
                            <span className={styles.deckButtonValue}>{props.deckSize}</span>
                        </Button>
                    )
                    : (
                        <CardDropTarget id="discard" targetType="any" className={styles.deckIndicator}>
                            <NumberIndicator
                                value={props.deckSize}
                                icon={DrawIcon}
                                name="Deck"
                                description={(
                                    <>
                                        Drag cards here to return them to the bottom of your deck.
                                    </>
                                )}
                                generation={props.cardGeneration}
                            />
                        </CardDropTarget>
                    )}
            </div>

            {props.deckView && <DeckView crew={props.crew} {...props.deckView} />}
        </div>
    );
};

import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Cooldown } from 'common-data/types/Cooldown';
import { Button } from 'common-ui/components/Button';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
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
    /** Omitted at a station, where no cards are played. Elsewhere, it shows e.g. reactor damage lowering a system's baseline power. */
    power?: number;
    deckSize: number;
    /** The ship's antimatter, shown at a shop station for this crew member. */
    antimatter?: number;
    cardGeneration?: Cooldown | null;
    /** Outside an encounter, the deck indicator becomes a button that opens this "my deck" view. During one, it is a discard target. */
    deckView?: DeckViewModel | null;
};

export const CrewHeader: FC<Props> = (props) => {
    return (
        <div className={styles.crewHeader} data-crew-header>
            <div className={styles.title}>
                <CrewMenu onPause={props.onPause} />

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

                {props.antimatter !== undefined && (
                    <NumberIndicator
                        value={props.antimatter}
                        icon={AntimatterIcon}
                        name="Antimatter"
                        description={(
                            <>
                                Antimatter
                                {' '}
                                <AntimatterIcon />
                                {' '}
                                is shared by the whole crew. It is gained by winning battles and selling cards, and spent on cards at stations.
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

            {props.deckView && <DeckView {...props.deckView} />}
        </div>
    );
};

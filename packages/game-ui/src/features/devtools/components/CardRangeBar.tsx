import { cardRangePresets, type CardRangeCommand, type CardRangeInfo, type CardRangePreset, type CardRangeStatus } from 'common-data/features/cards/types/CardRangeInfo';
import { Button } from 'common-ui/components/Button';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useEffect, useState } from 'react';
import { cardRangePresetLabels, cardRangeStatusLabels } from '../utils/cardRangeLabels';
import styles from './CardRangeBar.module.css';
import type { ColorPalette } from 'common-ui/types/ColorPalette';

type Props = {
    info: CardRangeInfo;
    send: (command: CardRangeCommand) => void;
};

const statusPalettes: Record<CardRangeStatus, ColorPalette> = {
    pass: 'good',
    fail: 'danger',
    skip: 'grey',
};

/** Dev tools: shown over the viewscreen while the card range is running, to go from card to card, deal the card again, and record how it went. */
export const CardRangeBar: FC<Props> = ({ info, send }) => {
    const card = info.cards[info.currentIndex];
    const [note, setNote] = useState(card?.note ?? '');

    // Show the note of whichever card is being tried, as that changes.
    useEffect(() => {
        setNote(card?.note ?? '');
    }, [card?.type, card?.note]);

    if (!card) {
        return null;
    }

    const tested = info.cards.filter(candidate => candidate.status).length;

    const mark = (status: CardRangeStatus | null) => send({ action: 'mark', status, note });

    const saveNote = () => {
        if (note.trim() !== (card.note ?? '')) {
            send({ action: 'mark', status: card.status ?? null, note });
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <span className={styles.name}>{getCardDefinition(card.type).name}</span>
                <span className={styles.details}>
                    {card.system}
                    {' · '}
                    {info.currentIndex + 1}
                    /
                    {info.cards.length}
                    {' · '}
                    {tested}
                    {' tested'}
                </span>
                {card.status && (
                    <span className={classNames(styles.status, styles[card.status])}>{cardRangeStatusLabels[card.status]}</span>
                )}
            </div>

            <div className={styles.row}>
                <Button onClick={() => send({ action: 'step', delta: -1 })} title="Previous card">◀</Button>
                <Button onClick={() => send({ action: 'step', delta: 1 })} title="Next card">▶</Button>
                <Button onClick={() => send({ action: 'step', delta: 1, untestedOnly: true })} title="Next card without a status">Next untested</Button>
                <Button onClick={() => send({ action: 'replay' })} title="Deal the card again">Replay</Button>
                <Button onClick={() => send({ action: 'reset' })} outlined title="Set the range up afresh, for this card">Reset</Button>
            </div>

            <div className={styles.row}>
                {(['pass', 'fail', 'skip'] as const).map(status => (
                    <Button
                        key={status}
                        palette={statusPalettes[status]}
                        outlined={card.status !== status}
                        onClick={() => mark(card.status === status ? null : status)}
                    >
                        {cardRangeStatusLabels[status]}
                    </Button>
                ))}

                <select
                    className={styles.preset}
                    value={card.preset}
                    onChange={e => send({ action: 'preset', preset: e.target.value as CardRangePreset })}
                    aria-label="What's set up for this card"
                >
                    {cardRangePresets.map(preset => (
                        <option key={preset} value={preset}>{cardRangePresetLabels[preset]}</option>
                    ))}
                </select>
            </div>

            <input
                className={styles.note}
                value={note}
                placeholder="Note (saved on Enter, or on leaving the box)"
                onChange={e => setNote(e.target.value)}
                onBlur={saveNote}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        saveNote();
                    }
                }}
            />
        </div>
    );
};

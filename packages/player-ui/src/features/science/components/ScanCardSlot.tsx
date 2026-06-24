import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { Card } from 'common-ui/features/cards/components/Card';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import styles from './ScanCardSlot.module.css';
import { ScanSection } from './ScanSection';

type Props = PropsWithChildren<{
    label: string;
    card: Snapshot<CardInstance> | null | undefined;
    emptyText: string;
    className?: string;
    emptyTextClassName?: string;
    modifiers?: Record<string, number>;
    slotted?: boolean;
}>;

export const ScanCardSlot = (props: Props) => {
    const { label, card, emptyText, className, emptyTextClassName, modifiers, slotted, children } = props;

    if (card) {
        const cardDef = getCardDefinition(card.type);
        return (
            <InfoPopup
                className={classNames(styles.slot, className)}
                description={<Card {...card} {...(modifiers !== undefined ? { modifiers } : undefined)} slotted={slotted} disabled={true} />}
            >
                <div className={styles.itemLabel}>{label}</div>
                <div className={styles.cardName}>{cardDef.name}</div>
                {children}
            </InfoPopup>
        );
    }

    return (
        <ScanSection label={label} className={className}>
            <div className={classNames(styles.cardName, emptyTextClassName)}>{emptyText}</div>
        </ScanSection>
    );
};

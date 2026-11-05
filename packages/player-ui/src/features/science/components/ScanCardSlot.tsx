import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { RestrictedHeightText } from 'common-ui/components/RestrictedHeightText';
import { Card } from 'common-ui/features/cards/components/Card';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren, ReactNode } from 'react';
import styles from './ScanCardSlot.module.css';
import { ScanSection, ScanSectionContent } from './ScanSection';
import sectionStyles from './ScanSection.module.css';

type Props = PropsWithChildren<{
    label: string;
    card: Snapshot<CardInstance> | null | undefined;
    emptyText: string;
    /** Shown at the end of the row, when there is a card. */
    end?: ReactNode;
    modifiers?: Record<string, number>;
    slotted?: boolean;
}>;

/** A scan readout row naming a card, which can be tapped to show the whole card. Its children go under the card's name. */
export const ScanCardSlot = (props: Props) => {
    const { label, card, emptyText, end, modifiers, slotted, children } = props;

    if (card) {
        const cardDef = getCardDefinition(card.type);
        return (
            <InfoPopup
                className={classNames(sectionStyles.row, styles.cardRow)}
                description={<Card {...card} {...(modifiers !== undefined ? { modifiers } : undefined)} slotted={slotted} disabled={true} />}
            >
                <ScanSectionContent label={label} end={end}>
                    <RestrictedHeightText className={styles.cardName}>{cardDef.name}</RestrictedHeightText>
                    {children}
                </ScanSectionContent>
            </InfoPopup>
        );
    }

    return (
        <ScanSection label={label}>
            <span className={styles.emptyText}>{emptyText}</span>
        </ScanSection>
    );
};

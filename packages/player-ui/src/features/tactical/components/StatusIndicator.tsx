import { classNames } from 'common-ui/classNames';
import { ColorPalette } from 'common-ui/ColorPalette';
import { InfoPopup } from 'common-ui/InfoPopup';
import React from 'react';
import styles from './StatusIndicator.module.css';

export interface Props {
    className?: string;
    chargeRemaining?: number;
    totalCharge: number | null;
    cannotFireReason?: string | null;
}

export const StatusIndicator: React.FC<Props> = (props) => {
    let content;
    let stateClass;
    let palette: ColorPalette | undefined;
    let heading;
    let description;

    if (props.totalCharge !== null) {
        if (props.chargeRemaining) {
            const numSegments = Math.max(props.totalCharge, 1);
            const numFilledSegments = Math.max(0, Math.min(numSegments, props.totalCharge - props.chargeRemaining));

            if (numFilledSegments === 0) {
                heading = 'Needs charged';
                content = 'charge';
            } else {
                stateClass = styles.charging;
                heading = 'Charging';
                // Show charge indicator
                content = Array.from({ length: numSegments }).map((_, i) => (
                    <div
                        key={i}
                        className={classNames(
                            styles.chargeSegment,
                            i < numFilledSegments ? styles.filledSegment : styles.emptySegment
                        )}
                    />
                ));
            }
            description = <>Drag other cards onto this weapon slot to charge it up.</>;
            palette = 'energy';
        } else if (props.cannotFireReason) {
            content = props.cannotFireReason;
            heading = 'Unable to fire';
            description = <>Target is out of weapon range.</>;
            palette = 'danger';
        } else {
            content = 'ready';
            heading = 'Ready to fire';
            description = <>Drag this slot's card onto the current target to fire.</>;
            palette = 'good';
        }
    } else {
        content = 'no card';
        heading = 'Empty slot';
        description = <>Drag a card into this weapon slot to be able to fire it.</>;
    }

    return (
        <InfoPopup
            className={classNames(props.className, styles.statusIndicator, stateClass)}
            name={heading}
            description={description}
            palette={palette}
        >
            {content}
        </InfoPopup>
    );
};

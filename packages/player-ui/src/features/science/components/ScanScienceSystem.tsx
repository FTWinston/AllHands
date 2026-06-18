import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { resolveParameter } from 'common-ui/types/resolveParameters';
import { classNames } from 'common-ui/utils/classNames';
import { ScanBase } from './ScanBase';
import styles from './ScanScienceSystem.module.css';

type Props = Snapshot<ScannedScienceInfo>;

const CardDisplay = (props: Snapshot<CardInstance>) => {
    const cardDef = getCardDefinition(props.type);

    const cost = resolveParameter('cost', cardDef.parameters, props.modifiers);

    return (
        <div className={classNames(styles.card)}>
            <div className={styles.cardName}>{cardDef.name}</div>
            <div className={styles.cardCost}>{`Cost: ${cost}`}</div>
        </div>
    );
};

export const ScanScienceSystem = (props: Props) => {
    return (
        <ScanBase className={styles.root} system="science" revealed>
            {props.deflectorCard ? (
                <CardDisplay {...props.deflectorCard} />
            ) : (
                <div className={classNames(styles.card, styles.cardEmpty)}>(Deflector offline)</div>
            )}
        </ScanBase>
    );
};

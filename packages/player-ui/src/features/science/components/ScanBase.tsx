import { Popover } from '@base-ui-components/react/popover';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ObjectId } from 'common-data/features/space/types/GameObjectInfo';
import { getIndefiniteArticle } from 'common-data/utils/strings';
import { Button } from 'common-ui/components/Button';
import { Popup } from 'common-ui/components/Popup';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    contentClassName?: string;
    targetName?: string;
    targetId: ObjectId;
    system: CrewRoleName;
    vulnerability: EnemyTargetedCardType | null;
    onClose?: () => void;
}>;

export const ScanBase = (props: Props) => {
    const id = `target/${props.targetId}/${props.system}`;

    const vulnerabilityName = props.vulnerability ? getCardDefinition(props.vulnerability).name : null;

    const anchorRef = useRef<HTMLDivElement>(null);
    const [vulnerabilityIsOpen, setVulnerabilityIsOpen] = useState(false);

    useEffect(() => {
        setVulnerabilityIsOpen(!!props.vulnerability);
    }, [props.vulnerability]);

    return (
        <Popover.Root
            open={vulnerabilityIsOpen}
            onOpenChange={setVulnerabilityIsOpen}
        >
            <CardDropTarget
                ref={anchorRef}
                targetType="scan"
                id={id}
                className={styles.root}
            >
                <h2 className={styles.targetName}>{props.targetName}</h2>
                <h3 className={styles.systemName}>{props.system}</h3>
                <Button className={styles.closeButton} onClick={props.onClose}>
                    ✕
                </Button>
                <div className={classNames(styles.content, props.contentClassName)}>
                    {props.children}
                </div>

                <Popup
                    anchor={anchorRef}
                    description={(
                        vulnerabilityName ? (
                            <>
                                Exposure to
                                {' '}
                                {getIndefiniteArticle(vulnerabilityName)}
                                {' '}
                                <span className={styles.vulnerabilityName}>{vulnerabilityName}</span>
                                {' '}
                                would create a vulnerability in this system.
                            </>
                        ) : <></>)}
                />
            </CardDropTarget>
        </Popover.Root>
    );
};

import { IArray } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import { RepairIndicator } from './RepairIndicator';
import { System, SystemInfo } from './System';
import { SystemCards, SystemCardsDialog } from './SystemCardsDialog';
import styles from './SystemList.module.css';

type Props = {
    systems: IArray<SystemInfo & SystemCards>;
    repairCapacity: number;
    maxRepairCapacity: number;
};

export const SystemList = (props: Props) => {
    const activeCard = useActiveCard();
    const isAlternateDrag = activeCard?.isAlternateDrag === true;

    // Kept once the dialog closes, so its contents don't change as it fades out.
    const [cardsSystem, setCardsSystem] = useState<ShipSystem | null>(null);
    const [isViewingCards, setViewingCards] = useState(false);
    const viewedSystem = props.systems.find(system => system.system === cardsSystem);

    return (
        <>
            <ul className={styles.list}>
                {props.systems.map(system => (
                    <CardDropTarget
                        render="li"
                        className={styles.itemWrapper}
                        key={system.system}
                        targetType="system"
                        id={system.system}
                    >
                        <System
                            {...system}
                            onViewCards={() => {
                                setCardsSystem(system.system);
                                setViewingCards(true);
                            }}
                        />
                    </CardDropTarget>
                ))}

                <CardDropTarget
                    render="li"
                    className={styles.repairWrapper}
                    targetType="system"
                    id="repair"
                    disabled={isAlternateDrag}
                >
                    <RepairIndicator value={props.repairCapacity} max={props.maxRepairCapacity} />
                </CardDropTarget>
            </ul>

            {viewedSystem && (
                <SystemCardsDialog
                    system={viewedSystem.system}
                    hand={viewedSystem.hand}
                    deck={viewedSystem.deck}
                    pendingDrawChoice={viewedSystem.pendingDrawChoice}
                    isOpen={isViewingCards}
                    setOpen={setViewingCards}
                />
            )}
        </>
    );
};

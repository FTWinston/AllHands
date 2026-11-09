import { IArray } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { shieldTuningEffects } from 'common-data/features/ships/utils/shieldStats';
import { useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import { getHullShieldCapacity } from 'src/features/shields/utils/getHullShieldCapacity';
import { RepairIndicator } from './RepairIndicator';
import { ShieldSummaryInfo } from './ShieldStatsSummary';
import { System, SystemInfo } from './System';
import { SystemCards, SystemCardsDialog } from './SystemCardsDialog';
import styles from './SystemList.module.css';

type Props = {
    systems: IArray<SystemInfo & SystemCards>;
    repairCapacity: number;
    maxRepairCapacity: number;
};

/** The hull's shields, worked out from its effects and all of its cards. Undefined for other systems. */
function getShieldInfo(system: SystemInfo & SystemCards): ShieldSummaryInfo | undefined {
    if (system.system !== 'hull') {
        return undefined;
    }

    const effectLevel = (type: string) => system.effects?.find(effect => effect.type === type)?.level ?? 0;

    return {
        capacity: getHullShieldCapacity([...system.hand, ...system.deck]),
        level: effectLevel('shield'),
        power: system.power,
        reinforced: effectLevel('shieldReinforced'),
        braced: effectLevel('hullBraced'),
        tuned: {
            energy: effectLevel(shieldTuningEffects.energy),
            torpedo: effectLevel(shieldTuningEffects.torpedo),
        },
        scrambled: effectLevel('shieldScrambled'),
    };
}

export const SystemList = (props: Props) => {
    const activeCard = useActiveCard();
    const isAlternateDrag = activeCard?.isAlternateDrag === true;

    // Kept once the dialog closes, so its contents don't change as it fades out.
    const [cardsSystem, setCardsSystem] = useState<ShipSystem | null>(null);
    const [isViewingCards, setViewingCards] = useState(false);
    const viewedSystem = props.systems.find(system => system.system === cardsSystem);
    const hullShield = getShieldInfo(props.systems.find(system => system.system === 'hull')!);

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
                            shield={system.system === 'hull' && hullShield ? { level: hullShield.level, max: hullShield.capacity } : undefined}
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
                    shield={viewedSystem.system === 'hull' ? hullShield : undefined}
                    hand={viewedSystem.hand}
                    deck={viewedSystem.deck}
                    isOpen={isViewingCards}
                    setOpen={setViewingCards}
                />
            )}
        </>
    );
};

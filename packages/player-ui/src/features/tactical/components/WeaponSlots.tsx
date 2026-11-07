import { Snapshot } from '@colyseus/react';
import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { WeaponSlot } from './WeaponSlot';
import styles from './WeaponSlots.module.css';

type Props = {
    slots: Snapshot<WeaponSlotInfo[]>;
    firingSolution: FiringSolution | null;
    onEject: (slotId: string) => void;
};

export const WeaponSlots = (props: Props) => {
    return (
        <ol className={styles.weaponSlots}>
            {props.slots.map((slot, index) => (
                <WeaponSlot
                    {...slot}
                    slotNumber={index + 1}
                    firingSolution={props.firingSolution}
                    onEject={() => props.onEject(slot.id)}
                    key={index}
                />
            ))}
        </ol>
    );
};

import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { WeaponSlot } from './WeaponSlot';
import styles from './WeaponSlots.module.css';

type Props = {
    slots: MinimalReadonlyArray<WeaponSlotInfo>;
    firingSolution: FiringSolution | null;
};

export const WeaponSlots = (props: Props) => {
    return (
        <ol className={styles.weaponSlots}>
            {props.slots.map((slot, index) => (
                <WeaponSlot
                    {...slot}
                    firingSolution={props.firingSolution}
                    key={index}
                />
            ))}
        </ol>
    );
};

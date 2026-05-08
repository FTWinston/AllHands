import { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { SlotProps, WeaponSlot } from './WeaponSlot';
import styles from './WeaponSlots.module.css';

type Props = {
    slots: MinimalReadonlyArray<SlotProps>;
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

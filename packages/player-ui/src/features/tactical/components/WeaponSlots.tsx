import { SlotProps, WeaponSlot } from './WeaponSlot';
import styles from './WeaponSlots.module.css';

type Props = {
    slots: SlotProps[];
    onFired: (slotIndex: number) => void;
};

export const WeaponSlots = (props: Props) => {
    return (
        <ol className={styles.weaponSlots}>
            {props.slots.map((slot, index) => (
                <WeaponSlot
                    {...slot}
                    key={index}
                    onFired={() => props.onFired(index)}
                />
            ))}
        </ol>
    );
};

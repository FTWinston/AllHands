import { CardInstance } from 'common-types';
import { WeaponSlot } from './WeaponSlot';
import styles from './WeaponSlots.module.css';

export type SlotProps = {
    name: string;
    costToReactivate?: number;
    card: CardInstance | null;
};

type Props = {
    slots: SlotProps[];
    onFired: (slotIndex: number) => void;
    onDeactivate: (slotIndex: number) => void;
};

export const WeaponSlots = (props: Props) => {
    return (
        <ol className={styles.weaponSlots}>
            {props.slots.map((slot, index) => (
                <WeaponSlot
                    {...slot}
                    key={index}
                    onFired={() => props.onFired(index)}
                    onDeactivate={() => props.onDeactivate(index)}
                />
            ))}
        </ol>
    );
};

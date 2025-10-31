import { CardProps } from 'common-ui/Card';
import { WeaponSlot } from './WeaponSlot';
import styles from './WeaponSlots.module.css';

export type SlotProps = {
    name: string;
    costToReactivate?: number;
    card: CardProps | null;
};

type Props = {
    slots: SlotProps[];
};

export const WeaponSlots = (props: Props) => {
    return (
        <ol className={styles.weaponSlots}>
            {props.slots.map((slot, index) => (
                <WeaponSlot
                    {...slot}
                    key={index}
                    onFired={() => {}}
                    onDeactivate={() => {}}
                />
            ))}
        </ol>
    );
};

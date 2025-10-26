import { Card, CardProps } from 'common-ui/Card';
import { CardBase } from 'common-ui/CardBase';
import { classNames } from 'common-ui/classNames';
import { CardDropTarget } from 'src/components/CardDropTarget';
import styles from './WeaponSlots.module.css';

export type SlotProps = {
    name: string;
    tapped: boolean;
    card: CardProps | null;
};

type Props = {
    slots: SlotProps[];
};

export const WeaponSlots = (props: Props) => {
    return (
        <ol className={styles.weaponSlots}>
            {props.slots.map((slot, index) => (
                <CardDropTarget render="li" className={classNames(styles.weaponSlot, slot.tapped ? styles.tapped : null)} targetType="weapon-slot" key={index} id={slot.name}>
                    <div className={styles.slotName}>{slot.name}</div>
                    {slot.card
                        ? <Card className={styles.card} {...slot.card} hideStats={true} />
                        : (
                            <CardBase className={styles.noCard}>
                                <div className={styles.noCardLabel}>No card</div>
                            </CardBase>
                        )}
                </CardDropTarget>
            ))}
        </ol>
    );
};

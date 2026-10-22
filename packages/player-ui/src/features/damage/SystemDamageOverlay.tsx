import { FC, useEffect, useRef } from 'react';
import styles from './SystemDamageOverlay.module.css';

type Props = {
    /** 0 when undamaged, 1 when every card is damaged. */
    damage: number;
};

/** From this fraction of cards damaged, the header turns red. */
const badDamage = 2 / 3;

/**
 * Shows how damaged this station's system is: the screen flickers with interference, and the header turns red once it's bad.
 * Also flashes red whenever the system takes more damage. Doesn't block any interaction.
 */
export const SystemDamageOverlay: FC<Props> = ({ damage }) => {
    const flash = useRef<HTMLDivElement>(null);

    // CrewHeader turns red once the system is badly damaged, brighter the worse it gets.
    useEffect(() => {
        if (damage < badDamage) {
            return;
        }

        document.body.dataset.systemDamaged = '';
        document.body.style.setProperty('--system-damage', String((damage - badDamage) / (1 - badDamage)));
        return () => {
            delete document.body.dataset.systemDamaged;
            document.body.style.removeProperty('--system-damage');
        };
    }, [damage]);

    const previousDamage = useRef(damage);
    useEffect(() => {
        if (damage > previousDamage.current) {
            flash.current?.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: 500, easing: 'ease-out' });
        }
        previousDamage.current = damage;
    }, [damage]);

    return (
        <>
            {damage > 0 && (
                <div
                    className={styles.interference}
                    style={{ opacity: damage * 0.5 }}
                />
            )}
            <div ref={flash} className={styles.flash} />
        </>
    );
};

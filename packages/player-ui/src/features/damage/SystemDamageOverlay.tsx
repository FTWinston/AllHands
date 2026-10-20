import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { SystemHealthChange } from 'common-data/features/ships/types/SystemHealthChange';
import { FC, useEffect, useRef } from 'react';
import styles from './SystemDamageOverlay.module.css';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<unknown, GameState>;
    system: CrewRoleName;
    /** 0 when undamaged, 1 when every card is damaged. */
    damage: number;
};

/** From this fraction of cards damaged, the header turns red. */
const badDamage = 2 / 3;

/**
 * Shows how damaged this station's system is: the screen flickers with interference, and the header turns red once it's bad.
 * Also flashes red whenever the system takes a hit. Doesn't block any interaction.
 */
export const SystemDamageOverlay: FC<Props> = ({ room, system, damage }) => {
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

    useEffect(() => room.onMessage<SystemHealthChange>('systemHealth', (message) => {
        if (message.system === system && message.change < 0) {
            flash.current?.animate([{ opacity: 0.6 }, { opacity: 0 }], { duration: 500, easing: 'ease-out' });
        }
    }), [room, system]);

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

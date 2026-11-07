import { Screen } from 'common-ui/components/Screen';
import { FC, PropsWithChildren } from 'react';
import { ChaseLights } from 'src/components/ChaseLights';
import { CrewStripe } from 'src/components/CrewStripe';
import styles from './Menu.module.css';
import { MenuBackdrop } from './MenuBackdrop';

type Props = {
    /** What this menu is for, shown above its items. The game's name is always shown above that. */
    heading?: string;
    /** A note at the foot of the screen. */
    footer?: string;
};

export const Menu: FC<PropsWithChildren<Props>> = props => (
    <Screen className={styles.screen}>
        <MenuBackdrop />
        <div className={styles.content}>
            <p className={styles.tagline}>Real-time card-based co-op starship roguelike</p>
            <h1 className={styles.title}>All Hands</h1>
            <CrewStripe className={styles.stripe} />

            <div className={styles.menuArea}>
                {props.heading && <h2 className={styles.heading}>{props.heading}</h2>}

                <nav className={styles.menuRoot} aria-label={props.heading ?? 'Main menu'}>
                    <ul className={styles.menuList}>
                        {props.children}
                    </ul>
                </nav>
            </div>
        </div>
        {props.footer && <p className={styles.footer}>{props.footer}</p>}
        <ChaseLights />
    </Screen>
);

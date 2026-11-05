import { FC } from 'react';
import styles from './MenuBackdrop.module.css';

/** A faint sector route behind the menus, drawn like the sector map. */
export const MenuBackdrop: FC = () => (
    <svg className={styles.backdrop} viewBox="0 0 860 900" aria-hidden="true">
        <g className={styles.edges}>
            <path className={styles.travelled} d="M150 450 H230 Q250 450 250 430 V290 Q250 270 270 270 H385" />
            <path className={styles.available} d="M430 270 H510 Q530 270 530 250 V190 Q530 170 550 170 H640" />
            <path className={styles.available} d="M430 270 H510 Q530 270 530 290 V370 Q530 390 550 390 H640" />
            <path className={styles.unreachable} d="M150 450 H230 Q250 450 250 470 V610 Q250 630 270 630 H385" />
            <path className={styles.unreachable} d="M430 630 H640" />
            <path className={styles.unreachable} d="M430 630 H510 Q530 630 530 650 V710 Q530 730 550 730 H640" />
            <path className={styles.unreachable} d="M685 170 H730 Q750 170 750 190 V430 Q750 450 770 450 H780" />
            <path className={styles.unreachable} d="M685 390 H730 Q750 390 750 410 V430" />
            <path className={styles.unreachable} d="M685 630 H730 Q750 630 750 610 V470 Q750 450 770 450" />
            <path className={styles.unreachable} d="M685 730 H730 Q750 730 750 710 V630" />
        </g>

        <g className={styles.repair} transform="translate(128 450)" opacity="0.5">
            <rect x="-22" y="-22" width="44" height="44" rx="7" />
            <path d="M0 -11V11M-11 0H11" />
        </g>
        <g transform="translate(408 270)">
            <circle className={styles.currentRing} r="34" />
            <g className={styles.shop}>
                <rect x="-22" y="-22" width="44" height="44" rx="7" />
                <circle r="9" />
            </g>
        </g>
        <g transform="translate(662 170)">
            <circle className={styles.availableRing} r="34" />
            <g className={styles.combat}>
                <circle r="22" />
                <path d="M-10 -10L10 10M10 -10L-10 10" />
            </g>
        </g>
        <g transform="translate(662 390)">
            <circle className={styles.availableRing} r="34" />
            <g className={styles.repair}>
                <rect x="-22" y="-22" width="44" height="44" rx="7" />
                <path d="M0 -11V11M-11 0H11" />
            </g>
        </g>
        <g className={styles.combat} transform="translate(408 630)" opacity="0.45">
            <circle r="22" />
            <path d="M-10 -10L10 10M10 -10L-10 10" />
        </g>
        <g className={styles.combat} transform="translate(662 630)" opacity="0.45">
            <polygon points="0,-27 6,-8 26,-8 10,4 16,24 0,12 -16,24 -10,4 -26,-8 -6,-8" />
        </g>
        <g className={styles.shop} transform="translate(662 730)" opacity="0.45">
            <rect x="-22" y="-22" width="44" height="44" rx="7" />
            <circle r="9" />
        </g>
        <g className={styles.boss} transform="translate(806 450)" opacity="0.6">
            <polygon points="30,12 12,30 -12,30 -30,12 -30,-12 -12,-30 12,-30 30,-12" />
            <circle r="10" />
        </g>
    </svg>
);

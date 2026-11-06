import { projectileFlightTime } from 'common-data/features/space/types/WeaponEffect';

export type WeaponKind = 'beam' | 'projectile' | 'deflector';

/** How a weapon looks when it fires. */
export type WeaponVisual = {
    kind: WeaponKind;
    /** A six digit hex color. */
    color: string;
    /** Thickness in world units. */
    thickness: number;
    /** How much it glows, where 1 is normal. */
    brightness: number;
    /** How long it lasts, in game-time milliseconds. */
    duration: number;
    /** What to call it, where there's room for that. */
    label: string;
};

const weaponVisuals: Record<string, WeaponVisual> = {
    phaserCannon: { kind: 'beam', label: 'Phaser cannon', color: '#ff4400', thickness: 0.15, brightness: 1.5, duration: 600 },
    phaserStrip: { kind: 'beam', label: 'Phaser strip', color: '#ff8800', thickness: 0.1, brightness: 1.2, duration: 800 },
    photonicCannon: { kind: 'beam', label: 'Photonic cannon', color: '#ffcc00', thickness: 0.25, brightness: 2, duration: 1000 },
    photonTorpedo: { kind: 'projectile', label: 'Photon torpedo', color: '#ffd000', thickness: 0.2, brightness: 2, duration: projectileFlightTime },
    quantumTorpedo: { kind: 'projectile', label: 'Quantum torpedo', color: '#89caff', thickness: 0.2, brightness: 2, duration: projectileFlightTime },
};

/** What a deflector card's name says about how it looks. */
export type DeflectorParts = {
    modifier: string;
    substance: string;
    delivery: string;
};

const deflectorPattern = /^deflector(Phased|Coherent|Inverted|Modulated)(Antiproton|Tetryon|Chroniton|Graviton|Polaron)(Beam|Pulse|Burst|Field)$/;

const substanceColors: Record<string, string> = {
    Antiproton: '#ff5fd2',
    Tetryon: '#3ff0c8',
    Chroniton: '#ffc24a',
    Graviton: '#8fa6ff',
    Polaron: '#9dff4f',
};

/** Split up a deflector card's type, or get null if it's some other kind of card. */
export function getDeflectorParts(weapon: string): DeflectorParts | null {
    const match = deflectorPattern.exec(weapon);
    return match ? { modifier: match[1], substance: match[2], delivery: match[3] } : null;
}

/** How the given card looks when it fires. A card with no look of its own is drawn as a plain beam. */
export function getWeaponVisual(weapon: string): WeaponVisual {
    const parts = getDeflectorParts(weapon);

    if (parts) {
        return {
            kind: 'deflector',
            label: `${parts.modifier} ${parts.substance} ${parts.delivery}`,
            color: substanceColors[parts.substance],
            thickness: 0.12,
            brightness: 2,
            duration: 1500,
        };
    }

    return weaponVisuals[weapon] ?? weaponVisuals.phaserStrip;
}

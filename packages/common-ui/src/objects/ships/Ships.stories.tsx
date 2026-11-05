import { capitalShipAppearances, smallCraftAppearances, unusualShipAppearances, type ShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { FC, useEffect, useRef } from 'react';
import { ObjectIcon } from '..';
import { getColors } from '../../features/spacemap/utils/relationshipColors';
import { getSvgBitmap } from '../../features/spacemap/utils/svgBitmapCache';
import styles from './Ships.stories.module.css';
import type { ShipMapStyle } from '../mapSvg';
import type { Meta, StoryObj } from '@storybook/react-vite';

const families: { label: string; appearances: readonly ShipAppearance[] }[] = [
    { label: 'Small craft', appearances: smallCraftAppearances },
    { label: 'Capital and medium ships', appearances: capitalShipAppearances },
    { label: 'Unusual and non-military', appearances: unusualShipAppearances },
];

/** A ship's size on a map at its usual zoom, and at the helm's furthest out. */
const mapSize = 64;
const zoomedOutMapSize = 32;

type MapShipProps = {
    appearance: ShipAppearance;
    shipStyle?: ShipMapStyle;
    size: number;
    /** Radians, clockwise from pointing right. */
    angle?: number;
};

/** Draws a ship just as the space map does, including the bitmap it's scaled down from. */
const MapShip: FC<MapShipProps> = ({ appearance, shipStyle, size, angle = 0 }) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let frame: number;

        const draw = () => {
            const ctx = canvas.current?.getContext('2d');
            const [main, highlight] = getColors(RelationshipType.Hostile);
            const bitmap = getSvgBitmap(appearance, main, highlight, shipStyle);

            if (!ctx || !bitmap) {
                frame = requestAnimationFrame(draw);
                return;
            }

            const scale = window.devicePixelRatio || 1;
            ctx.canvas.width = size * scale;
            ctx.canvas.height = size * scale;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.setTransform(scale * size / 2, 0, 0, scale * size / 2, scale * size / 2, scale * size / 2);
            ctx.rotate(angle);
            ctx.drawImage(bitmap, -1, -1, 2, 2);
        };

        draw();
        return () => cancelAnimationFrame(frame);
    }, [appearance, shipStyle, size, angle]);

    return <canvas ref={canvas} style={{ width: size, height: size, display: 'block' }} />;
};

/** Every ship design as big as on a target, then as it's drawn on the viewscreen's map, then on the helm's. */
const Catalogue: FC = () => (
    <div className={styles.root}>
        {families.map(family => (
            <section key={family.label} className={styles.family}>
                <h2 className={styles.familyHeading}>{`${family.label} · ${family.appearances.length}`}</h2>
                <ul className={styles.grid}>
                    {family.appearances.map(appearance => (
                        <li key={appearance} className={styles.tile}>
                            <ObjectIcon appearance={appearance} className={styles.large} />
                            <span className={styles.sizes}>
                                <MapShip appearance={appearance} size={mapSize} />
                                <MapShip appearance={appearance} size={mapSize} angle={-0.6} />
                                <MapShip appearance={appearance} shipStyle="silhouette" size={mapSize} />
                                <MapShip appearance={appearance} shipStyle="silhouette" size={mapSize} angle={-0.6} />
                                <MapShip appearance={appearance} shipStyle="silhouette" size={zoomedOutMapSize} />
                            </span>
                            <span className={styles.name}>{appearance}</span>
                        </li>
                    ))}
                </ul>
            </section>
        ))}
    </div>
);

const meta: Meta<typeof Catalogue> = {
    title: 'common-ui/Ship appearances',
    component: Catalogue,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;

export const ShipAppearances: StoryObj<typeof Catalogue> = {
    name: 'Ship appearances',
};

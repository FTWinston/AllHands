import { capitalShipAppearances, shipAppearances, smallCraftAppearances, unusualShipAppearances, type ObjectAppearance, type ShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { FC, useEffect, useMemo, useRef } from 'react';
import { ObjectIcon } from '..';
import { SpaceMap } from '../../features/spacemap/components/SpaceMap';
import { getColors } from '../../features/spacemap/utils/relationshipColors';
import { getSvgBitmap } from '../../features/spacemap/utils/svgBitmapCache';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import styles from './Ships.stories.module.css';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';

const families: { label: string; appearances: readonly ShipAppearance[] }[] = [
    { label: 'Small craft', appearances: smallCraftAppearances },
    { label: 'Capital and medium ships', appearances: capitalShipAppearances },
    { label: 'Unusual and non-military', appearances: unusualShipAppearances },
];

const defaultCellRadius = 32;
const zoomedOutCellRadius = 16;

/** A ship's size on the map at a given cell radius, as objects are drawn two cells' radii across. */
const getMapSize = (cellRadius: number) => cellRadius * 2;

type MapShipProps = {
    appearance: ObjectAppearance;
    relationship?: RelationshipType;
    size: number;
    /** Radians, clockwise from pointing right. */
    angle?: number;
};

/** Draws an object just as the space map does, including the bitmap it's scaled down from. */
const MapShip: FC<MapShipProps> = ({ appearance, relationship = RelationshipType.Hostile, size, angle = 0 }) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let frame: number;

        const draw = () => {
            const ctx = canvas.current?.getContext('2d');
            const [main, highlight] = getColors(relationship);
            const bitmap = getSvgBitmap(appearance, main, highlight);

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
    }, [appearance, relationship, size, angle]);

    return <canvas ref={canvas} style={{ width: size, height: size, display: 'block' }} />;
};

/** Every ship design as big as on a target, then as it's drawn on a space map. */
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
                                <MapShip appearance={appearance} size={128} />
                                <MapShip appearance={appearance} size={getMapSize(defaultCellRadius)} />
                                <MapShip appearance={appearance} size={getMapSize(defaultCellRadius)} angle={-0.6} />
                                <MapShip appearance={appearance} size={getMapSize(zoomedOutCellRadius)} />
                            </span>
                            <span className={styles.name}>{appearance}</span>
                        </li>
                    ))}
                </ul>
            </section>
        ))}
    </div>
);

/** All the ships at the sizes they're drawn on a map, among the player's own ship. */
const MapSizes: FC<{ relationship: RelationshipType }> = ({ relationship }) => (
    <div className={styles.root}>
        {[defaultCellRadius, zoomedOutCellRadius].map(cellRadius => (
            <section key={cellRadius} className={styles.family}>
                <h2 className={styles.familyHeading}>{`Cell radius ${cellRadius}`}</h2>
                <div className={styles.field}>
                    <MapShip appearance="chevron" relationship={RelationshipType.Self} size={getMapSize(cellRadius)} />
                    {shipAppearances.map((appearance, index) => (
                        <MapShip
                            key={appearance}
                            appearance={appearance}
                            relationship={relationship}
                            size={getMapSize(cellRadius)}
                            angle={index * 0.7}
                        />
                    ))}
                </div>
            </section>
        ))}
    </div>
);

const fleet: { appearance: ShipAppearance; x: number; y: number }[] = [
    { appearance: 'dart-fighter', x: -3.5, y: -2 },
    { appearance: 'manta-command-ship', x: 3.5, y: -2.25 },
    { appearance: 'hammerhead-cruiser', x: 4.5, y: 1.5 },
    { appearance: 'kite-scout', x: -4.5, y: 1.25 },
    { appearance: 'segmented-battleship', x: 0.5, y: 3 },
    { appearance: 'mantis-drone', x: -1.5, y: -3 },
];

/** Enough looping movement to watch for several minutes, turning as they go. */
function getMotion(x: number, y: number, phase: number): GameObjectInfo['motion'] {
    const now = Date.now();
    const stepMs = 500;
    return Array.from({ length: 1200 }, (_, i) => {
        const turn = phase + i * 0.05;
        return { time: now + i * stepMs, x: x + Math.cos(turn) * 0.75, y: y + Math.sin(turn) * 0.75, angle: -(turn + Math.PI / 2) };
    });
}

const viewer = { shipId: 'player', faction: 'player', relations: { raiders: RelationshipType.Hostile } };

/** The real space map, with ships moving and turning beside the player's. */
const OnTheMap: FC<{ cellRadius: number }> = ({ cellRadius }) => {
    useAnimationFrame();
    const canvas = useRef<HTMLCanvasElement>(null);

    const objects = useMemo(() => {
        const objects: Record<string, GameObjectInfo> = {
            player: { id: 'player', name: 'Player', appearance: 'chevron', faction: 'player', motion: getMotion(0, 0, 0) },
        };
        fleet.forEach(({ appearance, x, y }, index) => {
            objects[appearance] = { id: appearance, name: appearance, appearance, faction: 'raiders', motion: getMotion(x, y, index) };
        });
        return objects;
    }, []);

    return (
        <SpaceMap
            ref={canvas}
            className={styles.map}
            objects={objects}
            gridColor="#333"
            cellRadius={cellRadius}
            center={{ x: 0, y: 0 }}
            viewer={viewer}
        />
    );
};

const meta: Meta = {
    title: 'common-ui/Ship appearances',
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;

export const AllShips: StoryObj<typeof Catalogue> = {
    render: () => <Catalogue />,
};

export const AtMapSizes: StoryObj<typeof MapSizes> = {
    render: args => <MapSizes {...args} />,
    args: { relationship: RelationshipType.Hostile },
    argTypes: {
        relationship: {
            control: 'select',
            options: [RelationshipType.Hostile, RelationshipType.Neutral, RelationshipType.Friendly, RelationshipType.Unknown],
            labels: {
                [RelationshipType.Hostile]: 'Hostile',
                [RelationshipType.Neutral]: 'Neutral',
                [RelationshipType.Friendly]: 'Friendly',
                [RelationshipType.Unknown]: 'Unknown',
            },
        },
    },
};

export const MovingOnTheMap: StoryObj<typeof OnTheMap> = {
    render: args => <OnTheMap {...args} />,
    args: { cellRadius: defaultCellRadius },
    argTypes: { cellRadius: { control: { type: 'range', min: 16, max: 128, step: 8 } } },
};

export const MovingZoomedOut: StoryObj<typeof OnTheMap> = {
    ...MovingOnTheMap,
    args: { cellRadius: zoomedOutCellRadius },
};

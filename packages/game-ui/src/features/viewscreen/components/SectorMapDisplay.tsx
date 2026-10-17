import { FC } from 'react';
import { layoutSectorMap, MapNodeStatus } from '../utils/layoutSectorMap';
import styles from './SectorMapDisplay.module.css';
import type { SectorMapInfo } from 'common-data/features/sectors/types/SectorMapInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

type Props = {
    map: SectorMapInfo;
};

const WIDTH = 1000;
const HEIGHT = 560;
const PADDING = 90;

const statusLabels: Record<MapNodeStatus, string> = {
    current: 'current position',
    visited: 'visited',
    available: 'available',
    unreachable: 'unreachable',
};

function getRadius(kind: SectorNodeKind) {
    return kind === 'boss' ? 38 : 28;
}

const NodeGlyph: FC<{ kind: SectorNodeKind; status: MapNodeStatus; radius: number }> = ({ kind, status, radius }) => {
    const inner = radius * 0.5;

    return (
        <g className={`${styles.glyph} ${styles[status]} ${styles[kind]}`}>
            {status === 'available' && <circle className={styles.halo} r={radius + 10} />}
            {status === 'current' && <circle className={styles.currentRing} r={radius + 10} />}

            {kind === 'combat' && (
                <>
                    <circle className={styles.shape} r={radius} />
                    <path className={styles.mark} d={`M${-inner} ${-inner}L${inner} ${inner}M${inner} ${-inner}L${-inner} ${inner}`} />
                </>
            )}
            {kind === 'repair' && (
                <>
                    <rect className={styles.shape} x={-radius} y={-radius} width={radius * 2} height={radius * 2} rx={radius * 0.3} />
                    <path className={styles.mark} d={`M0 ${-inner}V${inner}M${-inner} 0H${inner}`} />
                </>
            )}
            {kind === 'boss' && (
                <>
                    <polygon
                        className={styles.shape}
                        points={Array.from({ length: 8 }, (_, i) => {
                            const angle = (Math.PI / 4) * i + Math.PI / 8;
                            return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
                        }).join(' ')}
                    />
                    <circle className={styles.mark} r={inner * 0.8} />
                </>
            )}

            {status === 'visited' && (
                <path
                    className={styles.check}
                    d={`M${-radius * 0.35} ${radius * 0.05}L${-radius * 0.05} ${radius * 0.35}L${radius * 0.4} ${-radius * 0.3}`}
                />
            )}
        </g>
    );
};

const LegendGlyph: FC<{ kind: SectorNodeKind; status: MapNodeStatus }> = ({ kind, status }) => (
    <svg className={styles.legendGlyph} viewBox="-26 -26 52 52" aria-hidden="true">
        <NodeGlyph kind={kind} status={status} radius={14} />
    </svg>
);

function describeNode(kind: SectorNodeKind, status: MapNodeStatus): string {
    return `${kind} (${statusLabels[status]})`;
}

export const SectorMapDisplay: FC<Props> = ({ map }) => {
    const layout = layoutSectorMap(map, WIDTH, HEIGHT, PADDING);

    return (
        <section className={styles.root} aria-label={`Sector map: ${map.sectorName}`}>
            <header className={styles.header}>
                <h1 className={styles.title}>{map.sectorName}</h1>
                <p className={styles.subtitle}>
                    {`Sector ${map.sectorIndex + 1} of ${map.sectorCount}`}
                </p>
            </header>

            <div className={styles.body}>
                <svg className={styles.graph} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label="Route graph">
                    {layout.edges.map(edge => (
                        <line
                            key={edge.id}
                            className={`${styles.edge} ${styles[`edge_${edge.status}`]}`}
                            x1={edge.x1}
                            y1={edge.y1}
                            x2={edge.x2}
                            y2={edge.y2}
                        />
                    ))}

                    {layout.nodes.map(({ node, status, x, y }) => {
                        const radius = getRadius(node.kind);

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${x} ${y})`}
                                role="img"
                                aria-label={describeNode(node.kind, status)}
                                className={styles.node}
                            >
                                <NodeGlyph kind={node.kind} status={status} radius={radius} />
                            </g>
                        );
                    })}
                </svg>
            </div>

            <ul className={styles.legend} aria-label="Legend">
                <li>
                    <LegendGlyph kind="combat" status="unreachable" />
                    Combat
                </li>
                <li>
                    <LegendGlyph kind="repair" status="unreachable" />
                    Repair station
                </li>
                <li>
                    <LegendGlyph kind="boss" status="unreachable" />
                    Boss
                </li>
                <li>
                    <LegendGlyph kind="combat" status="current" />
                    Current position
                </li>
                <li>
                    <LegendGlyph kind="combat" status="visited" />
                    Visited
                </li>
                <li>
                    <LegendGlyph kind="combat" status="available" />
                    Available
                </li>
            </ul>
        </section>
    );
};

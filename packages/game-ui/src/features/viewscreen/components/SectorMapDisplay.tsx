import { getShopRole, isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import crewStyles from 'common-ui/CrewColors.module.css';
import { routeIconSize, StationIconShapes } from 'common-ui/features/cards/components/RouteIcon';
import { getNodeKindLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { ChaseLights } from 'src/components/ChaseLights';
import { getEdgePath, layoutSectorMap, MapEdgeLayout, MapEdgeStatus, MapNodeStatus } from '../utils/layoutSectorMap';
import { SceneTopBar } from './SceneTopBar';
import styles from './SectorMapDisplay.module.css';
import type { SectorMapInfo, SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';
import type { SectorNodeKind, StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';

type Props = {
    map: SectorMapInfo;
    /** The ship's antimatter. Omitted when unknown. */
    antimatter?: number;
    showMenu?: () => void;
};

const WIDTH = 1600;
const HEIGHT = 720;
const PADDING = 80;

const ARROW_LENGTH = 14;
const ARROW_WIDTH = 14;
/** Space between an arrowhead's tip and the node it points at, and between a node and the edges leaving it. */
const EDGE_GAP = 4;
const CORNER_RADIUS = 16;

/** Edges that matter more are drawn over those that overlap them. */
const edgeDrawOrder: Record<MapEdgeStatus, number> = {
    unreachable: 0,
    travelled: 1,
    available: 2,
};

const statusLabels: Record<MapNodeStatus, string> = {
    current: 'current position',
    visited: 'visited',
    available: 'available',
    unreachable: 'unreachable',
};

function getRadius(kind: SectorNodeKind) {
    return kind === 'boss' ? 32 : 24;
}

const Edge: FC<{ edge: MapEdgeLayout; fromKind: SectorNodeKind; toKind: SectorNodeKind }> = ({ edge, fromKind, toKind }) => {
    const startX = edge.x1 + getRadius(fromKind) + EDGE_GAP;
    const tipX = edge.x2 - getRadius(toKind) - EDGE_GAP;
    const baseX = tipX - ARROW_LENGTH;

    // Every edge ends heading right, so converging edges' arrowheads coincide.
    return (
        <g className={styles[`edge_${edge.status}`]}>
            <path className={styles.edgeLine} d={getEdgePath(edge, startX, baseX + 2, CORNER_RADIUS)} />
            <polygon className={styles.edgeArrow} points={`${tipX},${edge.y2} ${baseX},${edge.y2 - ARROW_WIDTH / 2} ${baseX},${edge.y2 + ARROW_WIDTH / 2}`} />
        </g>
    );
};

/** Points of a spiked ring, for elite encounters: alternately out past `radius` and in a little way short of it. */
function getSpikedPoints(radius: number, spikes: number) {
    return Array.from({ length: spikes * 2 }, (_, i) => {
        const angle = (Math.PI / spikes) * i;
        const distance = radius * (i % 2 === 0 ? 1.15 : 0.9);
        return `${Math.cos(angle) * distance},${Math.sin(angle) * distance}`;
    }).join(' ');
}

/** How much of the width of a station's square its icon takes up. */
const STATION_ICON_FILL = 0.85;

/** A station's square has the interface's cut corners, top right and bottom left. */
function getStationPoints(radius: number) {
    const cut = radius * 0.4;
    return [
        [-radius, -radius], [radius - cut, -radius], [radius, -radius + cut],
        [radius, radius], [-radius + cut, radius], [-radius, radius - cut],
    ].map(([x, y]) => `${x},${y}`).join(' ');
}

/** Every station is a square, holding the same icon as the helm's route card for it. */
const StationMark: FC<{ kind: StationKind; radius: number }> = ({ kind, radius }) => {
    const scale = (radius * 2 * STATION_ICON_FILL) / routeIconSize;

    return (
        <g className={styles.stationIcon} transform={`scale(${scale}) translate(${-routeIconSize / 2} ${-routeIconSize / 2})`}>
            <StationIconShapes kind={kind} />
        </g>
    );
};

const NodeGlyph: FC<{ kind: SectorNodeKind; elite?: boolean; status: MapNodeStatus; radius: number }> = ({ kind, elite, status, radius }) => {
    const inner = radius * 0.5;
    // A shop takes the colour of the crew member whose cards it sells.
    const shopRole = getShopRole(kind);

    return (
        <g className={classNames(styles.glyph, styles[status], styles[kind], shopRole ? crewStyles[shopRole] : null)}>
            {status === 'available' && <circle className={styles.halo} r={radius + 10} />}
            {status === 'current' && <circle className={styles.currentRing} r={radius + 10} />}

            {kind === 'combat' && (
                <>
                    {elite
                        ? <polygon className={styles.shape} points={getSpikedPoints(radius, 8)} />
                        : <circle className={styles.shape} r={radius} />}
                    <path className={styles.mark} d={`M${-inner} ${-inner}L${inner} ${inner}M${inner} ${-inner}L${-inner} ${inner}`} />
                </>
            )}
            {isStationKind(kind) && (
                <>
                    <polygon className={styles.shape} points={getStationPoints(radius)} />
                    <StationMark kind={kind} radius={radius} />
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

const LegendGlyph: FC<{ kind: SectorNodeKind; elite?: boolean; status: MapNodeStatus }> = ({ kind, elite, status }) => (
    <svg className={styles.legendGlyph} viewBox="-26 -26 52 52" aria-hidden="true">
        <NodeGlyph kind={kind} elite={elite} status={status} radius={14} />
    </svg>
);

/** One shop of each crew member's, so the legend's single shop entry shows all their colours. */
const shopLegendKinds: StationKind[] = ['navigationBeacon', 'armsDealer', 'researchOutpost', 'salvageYard'];

function describeNode(node: SectorMapNodeInfo, status: MapNodeStatus): string {
    return `${node.name}: ${getNodeKindLabel(node.kind, node.elite)} (${statusLabels[status]})`;
}

export const SectorMapDisplay: FC<Props> = ({ map, antimatter, showMenu }) => {
    const layout = layoutSectorMap(map, WIDTH, HEIGHT, PADDING);
    const kinds = new Map(layout.nodes.map(({ node }) => [node.id, node.kind]));
    const edges = [...layout.edges].sort((a, b) => edgeDrawOrder[a.status] - edgeDrawOrder[b.status]);

    return (
        <section className={styles.root} aria-label={`Sector map: ${map.sectorName}`}>
            <SceneTopBar
                subtitle={`Sector ${map.sectorIndex + 1} of ${map.sectorCount}`}
                title={map.sectorName}
                antimatter={antimatter}
                showMenu={showMenu}
            />

            <div className={styles.body}>
                <svg className={styles.graph} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label="Route graph">
                    {edges.map(edge => (
                        <Edge key={edge.id} edge={edge} fromKind={kinds.get(edge.fromId)!} toKind={kinds.get(edge.toId)!} />
                    ))}

                    {layout.nodes.map(({ node, status, x, y }) => {
                        const radius = getRadius(node.kind);
                        const showLabel = status === 'available' || status === 'current' || node.kind === 'boss';

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${x} ${y})`}
                                role="img"
                                aria-label={describeNode(node, status)}
                                className={styles.node}
                            >
                                <title>{describeNode(node, status)}</title>
                                <NodeGlyph kind={node.kind} elite={node.elite} status={status} radius={radius} />
                                {showLabel && (
                                    <text className={`${styles.nodeLabel} ${styles[status]}`} y={radius + 28} textAnchor="middle">
                                        {node.gridReference}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <ul className={styles.legend} aria-label="Legend">
                <li className={styles.legendHeading} aria-hidden="true">Legend</li>
                <li>
                    <LegendGlyph kind="combat" status="unreachable" />
                    {getNodeKindLabel('combat')}
                </li>
                <li>
                    <LegendGlyph kind="combat" elite status="unreachable" />
                    {getNodeKindLabel('combat', true)}
                </li>
                <li>
                    <LegendGlyph kind="repair" status="unreachable" />
                    {getNodeKindLabel('repair')}
                </li>
                <li>
                    <span className={styles.shopGlyphs} aria-hidden="true">
                        {shopLegendKinds.map(kind => <LegendGlyph key={kind} kind={kind} status="unreachable" />)}
                    </span>
                    Shop, for that crew member
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
                    <LegendGlyph kind="combat" status="available" />
                    Available
                </li>
            </ul>
            <ChaseLights />
        </section>
    );
};

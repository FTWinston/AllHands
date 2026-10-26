import { isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import type { SectorNodeKind, StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { FC, SVGProps } from 'react';

/** The size of the square that route and station icons are drawn in. */
export const routeIconSize = 64;

const common: SVGProps<SVGSVGElement> = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: `0 0 ${routeIconSize} ${routeIconSize}`,
    width: '100%',
    height: '100%',
    fill: 'none',
    stroke: 'var(--primary-lightest)',
    strokeWidth: 4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

/**
 * The unstyled shapes of a station's icon, in a `routeIconSize` square. They inherit their stroke from whatever contains them,
 * so the sector map can draw the same icon as the helm's route cards.
 */
export const StationIconShapes: FC<{ kind: StationKind }> = ({ kind }) => {
    switch (kind) {
        case 'repair':
            return (
                <>
                    <path d="M32 12v40M12 32h40" />
                    <circle cx="32" cy="32" r="22" />
                </>
            );
        case 'navigationBeacon':
            return (
                <>
                    <path d="M32 58V30M22 58h20" />
                    <circle cx="32" cy="22" r="5" />
                    <path d="M20 10a17 17 0 0 0 0 24M44 10a17 17 0 0 1 0 24" />
                </>
            );
        case 'armsDealer':
            return <path d="M12 12 44 44M52 12 20 44M38 50l12-12M14 38l12 12" />;
        case 'salvageYard':
            return (
                <>
                    <circle cx="32" cy="32" r="12" />
                    <path d="M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7" />
                </>
            );
        case 'researchOutpost':
            return (
                <>
                    <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(45 32 32)" />
                    <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(-45 32 32)" />
                    <circle cx="32" cy="32" r="4" />
                </>
            );
        default:
            throw new Error(`Station kind not found: ${kind satisfies never}`);
    }
};

export const RouteIcon: FC<{ nodeKind: SectorNodeKind }> = ({ nodeKind }) => {
    if (isStationKind(nodeKind)) {
        return (
            <svg {...common}>
                <StationIconShapes kind={nodeKind} />
            </svg>
        );
    }

    switch (nodeKind) {
        case 'combat':
            return (
                <svg {...common}>
                    <circle cx="32" cy="32" r="16" />
                    <path d="M32 6v14M32 44v14M6 32h14M44 32h14" />
                </svg>
            );
        case 'boss':
            return (
                <svg {...common}>
                    <path d="M32 8 40 24 58 26 45 38 49 56 32 47 15 56 19 38 6 26 24 24Z" />
                </svg>
            );
        default:
            throw new Error(`Node kind not found: ${nodeKind satisfies never}`);
    }
};

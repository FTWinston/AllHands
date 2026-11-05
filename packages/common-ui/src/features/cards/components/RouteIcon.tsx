import { isStationKind, shopStationRoles } from 'common-data/features/sectors/utils/isStationKind';
import crewStyles from '../../../CrewColors.module.css';
import { EngineeringIcon, HelmIcon, ScienceIcon, TacticalIcon } from '../../../icons/systems';
import type { SectorNodeKind, StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
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

const crewIcons: Record<CrewRoleName, FC<SVGProps<SVGSVGElement>>> = {
    helm: HelmIcon,
    tactical: TacticalIcon,
    science: ScienceIcon,
    engineer: EngineeringIcon,
};

/** A shop is shown as the crew member whose cards it sells, in their colour. */
const ShopIcon: FC<{ role: CrewRoleName }> = ({ role }) => {
    const Icon = crewIcons[role];
    return (
        <g className={crewStyles[role]}>
            <Icon x={10} y={10} width={44} height={44} style={{ color: 'var(--primary-light)' }} />
        </g>
    );
};

/**
 * The shapes of a station's icon, in a `routeIconSize` square. A repair station has no crew member, so it's a small, light plus.
 * Its stroke is inherited from whatever contains it, so the sector map can draw the same icon as the helm's route cards.
 * A shop's are always in its crew member's colour.
 */
export const StationIconShapes: FC<{ kind: StationKind }> = ({ kind }) => {
    switch (kind) {
        case 'repair':
            return <path d="M32 21v22M21 32h22" strokeLinecap="butt" />;
        case 'navigationBeacon':
        case 'armsDealer':
        case 'salvageYard':
        case 'researchOutpost':
            return <ShopIcon role={shopStationRoles[kind]} />;
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

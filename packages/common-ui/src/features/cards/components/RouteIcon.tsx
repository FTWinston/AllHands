import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { FC, SVGProps } from 'react';

const common: SVGProps<SVGSVGElement> = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 64 64',
    width: '100%',
    height: '100%',
    fill: 'none',
    stroke: 'var(--primary-lightest)',
    strokeWidth: 4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

export const RouteIcon: FC<{ nodeKind: SectorNodeKind }> = ({ nodeKind }) => {
    switch (nodeKind) {
        case 'combat':
            return (
                <svg {...common}>
                    <circle cx="32" cy="32" r="16" />
                    <path d="M32 6v14M32 44v14M6 32h14M44 32h14" />
                </svg>
            );
        case 'repair':
            return (
                <svg {...common}>
                    <path d="M32 12v40M12 32h40" />
                    <circle cx="32" cy="32" r="22" />
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

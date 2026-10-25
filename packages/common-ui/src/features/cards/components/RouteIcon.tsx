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
        case 'navigationBeacon':
            return (
                <svg {...common}>
                    <path d="M32 58V30M22 58h20" />
                    <circle cx="32" cy="22" r="5" />
                    <path d="M20 10a17 17 0 0 0 0 24M44 10a17 17 0 0 1 0 24" />
                </svg>
            );
        case 'armsDealer':
            return (
                <svg {...common}>
                    <path d="M12 12 44 44M52 12 20 44M38 50l12-12M14 38l12 12" />
                </svg>
            );
        case 'salvageYard':
            return (
                <svg {...common}>
                    <circle cx="32" cy="32" r="12" />
                    <path d="M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7" />
                </svg>
            );
        case 'researchOutpost':
            return (
                <svg {...common}>
                    <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(45 32 32)" />
                    <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(-45 32 32)" />
                    <circle cx="32" cy="32" r="4" />
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

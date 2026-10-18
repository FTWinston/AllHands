import { FC, SVGProps } from 'react';

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

export const WarpAwayIcon: FC = () => (
    <svg {...common}>
        <path d="M12 14 32 32 12 50M32 14 52 32 32 50" />
    </svg>
);

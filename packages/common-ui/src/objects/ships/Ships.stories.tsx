import { capitalShipAppearances, smallCraftAppearances, unusualShipAppearances, type ShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { FC } from 'react';
import { ObjectIcon } from '..';
import styles from './Ships.stories.module.css';
import type { Meta, StoryObj } from '@storybook/react-vite';

const families: { label: string; appearances: readonly ShipAppearance[] }[] = [
    { label: 'Small craft', appearances: smallCraftAppearances },
    { label: 'Capital and medium ships', appearances: capitalShipAppearances },
    { label: 'Unusual and non-military', appearances: unusualShipAppearances },
];

/** Every ship design, as big as on a target and as small as in the space view. */
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
                                <ObjectIcon appearance={appearance} className={styles.small} />
                                <ObjectIcon appearance={appearance} className={`${styles.small} ${styles.turned}`} />
                                <ObjectIcon appearance={appearance} className={styles.tiny} />
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
type Story = StoryObj<typeof meta>;

export const AllShips: Story = {};

import { IArray } from '@colyseus/react';
import { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { useId } from 'react';
import styles from './LongRangeSensorList.module.css';
import { LongRangeSensorTarget } from './LongRangeSensorTarget';
import targetListStyles from './ScienceTargetList.module.css';

type Props = {
    destinations: IArray<SectorDestinationInfo>;
};

/** Science's view of the sector map: the next destinations, scrolled through like science targets. */
export const LongRangeSensorList = (props: Props) => {
    const { destinations } = props;
    const headingId = useId();

    return (
        <section className={styles.root}>
            <h2 id={headingId} className={styles.title}>Long Range Sensors</h2>

            <HorizontalScroll
                className={targetListStyles.scrollArea}
                contentClassName={targetListStyles.content}
                contentRender={<ul aria-labelledby={headingId} />}
                snap={true}
            >
                {destinations.map((destination, index) => (
                    <li className={targetListStyles.itemWrapper} key={destination.id}>
                        <LongRangeSensorTarget
                            {...destination}
                            targetNumber={index + 1}
                            totalTargets={destinations.length}
                        />
                    </li>
                ))}
                {destinations.length === 0 && <li className={targetListStyles.itemWrapper}>No destinations in range</li>}
            </HorizontalScroll>
        </section>
    );
};

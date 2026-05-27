import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { HorizontalScroll } from 'common-ui/components/HorizontalScroll';
import { ScienceTarget } from './ScienceTarget';
import styles from './ScienceTargetList.module.css';

type Props = {
    targets: MinimalReadonlyArray<GameObjectInfo>;
};

export const ScienceTargetList = (props: Props) => {
    const { targets } = props;

    return (
        <HorizontalScroll
            className={styles.scrollArea}
            contentClassName={styles.content}
            contentRender={<ul />}
            snap={true}
        >
            {targets.map((target, index) => (
                <li className={styles.itemWrapper} key={target.id}>
                    <ScienceTarget
                        id={target.id}
                        name={target.name}
                        appearance={target.appearance}
                        relationship={target.relationship}
                        motion={target.motion}
                        targetNumber={index + 1}
                        totalTargets={targets.length}
                    />
                </li>
            ))}
        </HorizontalScroll>
    );
};

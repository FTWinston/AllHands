import { HorizontalScroll } from 'common-ui/HorizontalScroll';
import { CardDropTarget } from 'src/components/CardDropTarget';
import { Target, TargetInfo } from './Target';
import styles from './TargetList.module.css';

type Props = {
    targets: TargetInfo[];
};

export const TargetList = (props: Props) => {
    return (
        <HorizontalScroll
            className={styles.scrollArea}
            contentClassName={styles.content}
            contentRender={<ul />}
            snap={true}
        >
            {props.targets.map((target, index) => (
                <li key={target.id} className={styles.itemWrapper}>
                    <CardDropTarget targetType="enemy" id={target.id}>
                        <Target
                            id={target.id}
                            appearance={target.appearance}
                            targetNumber={index + 1}
                            totalTargets={props.targets.length}
                        />
                    </CardDropTarget>
                </li>
            ))}
        </HorizontalScroll>
    );
};

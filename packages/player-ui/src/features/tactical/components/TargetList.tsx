import { HorizontalScroll } from 'common-ui/HorizontalScroll';
import { CardDropTarget } from 'src/components/CardDropTarget';
import styles from './TargetList.module.css';

type Props = {
    targets: string[];
};

export const TargetList = (props: Props) => {
    return (
        <HorizontalScroll
            className={styles.scrollArea}
            contentClassName={styles.content}
            contentRender={<ul />}
        >
            {props.targets.map(target => (
                <li key={target}>
                    <CardDropTarget targetType="enemy" id={target}>
                        {target}
                    </CardDropTarget>
                </li>
            ))}
        </HorizontalScroll>
    );
};

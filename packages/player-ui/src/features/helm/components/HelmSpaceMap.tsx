import { ITimeProvider } from 'common-types';
import { SpaceCells } from 'common-ui/features/spacemap/components/SpaceCells';
import { CardDropTarget } from 'src/components/CardDropTarget';
import styles from './HelmSpaceMap.module.css';

type Props = {
    className?: string;
    timeSynchronizer: ITimeProvider;
};

export const HelmSpaceMap = (props: Props) => {
    return (
        <SpaceCells
            className={props.className}
            center={{ x: 0, y: 0 }}
            fontSizeEm={2}
            renderOverride={(id, CellComponent, cellProps) => (
                <CardDropTarget
                    id={id}
                    key={id}
                    render={CellComponent}
                    targetType="location"
                    couldDropClassName={styles.couldDrop}
                    droppingClassName={styles.dropping}
                    {...cellProps}
                />
            )}
        />
    );
};

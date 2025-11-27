import { ITimeProvider, Keyframes, Vector2D } from 'common-types';
import { SpaceCells } from 'common-ui/features/spacemap/components/SpaceCells';
import { MapItem } from 'common-ui/features/spacemap/types/MapItem';
import { CardDropTarget } from 'src/components/CardDropTarget';
import { useActiveCard } from 'src/components/DragCardProvider';
import styles from './HelmSpaceMap.module.css';

type Props = {
    className?: string;
    timeProvider: ITimeProvider;
    center: Keyframes<Vector2D>;
    items: MapItem[];
};

export const HelmSpaceMap = (props: Props) => {
    const activeCard = useActiveCard();

    return (
        <SpaceCells
            className={props.className}
            center={props.center}
            freezeCenter={activeCard?.targetType === 'location'}
            timeProvider={props.timeProvider}
            fontSizeEm={2}
            items={props.items}
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

import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { interpolateVector } from 'common-data/features/space/utils/interpolate';
import { Button } from 'common-ui/components/Button';
import { Screen } from 'common-ui/components/Screen';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { useAnimationFrame } from 'common-ui/hooks/useAnimationFrame';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC, PropsWithChildren, useRef } from 'react';
import styles from './ViewscreenDisplay.module.css';

type Props = PropsWithChildren<{
    center: ReadonlyKeyframes<Vector2D>;
    objects: Record<string, GameObjectInfo>;
    showMenu: () => void;
}>;

export const ViewscreenDisplay: FC<Props> = (props) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useAnimationFrame();

    const timeProvider = useTimeProvider();

    const currentTime = timeProvider.getServerTime();

    let centerVector = interpolateVector(props.center, currentTime);

    const cellRadius = 32; // TODO: make this controllable? automatic?

    return (
        <Screen>
            <Button
                className={styles.menuButton}
                title="Menu"
                onClick={props.showMenu}
            >
                <MenuIcon className={styles.menuButtonIcon} />
            </Button>

            <SpaceMap
                className={styles.spaceMap}
                center={centerVector}
                objects={props.objects}
                cellRadius={cellRadius}
                gridColor="grey"
                ref={canvas}
            />

            {props.children}
        </Screen>
    );
};

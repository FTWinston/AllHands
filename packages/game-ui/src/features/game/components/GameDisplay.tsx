import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { interpolateVector } from 'common-data/features/space/utils/interpolate';
import { Button } from 'common-ui/components/Button';
import { Screen } from 'common-ui/components/Screen';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { useAnimationFrame } from 'common-ui/hooks/useAnimationFrame';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC, useRef } from 'react';
import styles from './GameDisplay.module.css';

interface GameProps {
    timeProvider: ITimeProvider;
    center: Keyframes<Vector2D>;
    objects: GameObjectInfo[];
    showMenu: () => void;
}

export const GameDisplay: FC<GameProps> = (props) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useAnimationFrame();

    const currentTime = props.timeProvider.getServerTime();

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
                timeProvider={props.timeProvider}
                center={centerVector}
                objects={props.objects}
                cellRadius={cellRadius}
                gridColor="grey"
                ref={canvas}
            />
        </Screen>
    );
};

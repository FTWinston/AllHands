import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { interpolateVector } from 'common-data/features/space/utils/interpolate';
import { Button } from 'common-ui/components/Button';
import { Screen } from 'common-ui/components/Screen';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { useAnimationFrame } from 'common-ui/hooks/useAnimationFrame';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC, useRef, useState } from 'react';
import { DevTools } from './DevTools';
import styles from './ViewscreenDisplay.module.css';

type Props = {
    timeProvider: ITimeProvider;
    center: ReadonlyKeyframes<Vector2D>;
    objects: Record<string, GameObjectInfo>;
    showMenu: () => void;
};

export const ViewscreenDisplay: FC<Props> = (props) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    const [showTools, setShowTools] = useState(false);

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

            {import.meta.env.VITE_DEV_TOOLS && (
                <>
                    <Button
                        className={styles.devButton}
                        title="Dev"
                        onClick={() => setShowTools(true)}
                    >
                        Dev
                    </Button>

                    {showTools && (<DevTools isOpen={showTools} setOpen={setShowTools} addEffect={() => {}} />)}
                </>
            )}

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

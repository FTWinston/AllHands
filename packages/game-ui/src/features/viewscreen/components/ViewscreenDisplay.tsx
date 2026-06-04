import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { interpolateVector } from 'common-data/features/space/utils/interpolate';
import { Button } from 'common-ui/components/Button';
import { Screen } from 'common-ui/components/Screen';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { drawWeaponEffects } from 'common-ui/features/spacemap/utils/drawWeaponEffects';
import { useAnimationFrame } from 'common-ui/hooks/useAnimationFrame';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC, MutableRefObject, PropsWithChildren, useCallback, useRef } from 'react';
import styles from './ViewscreenDisplay.module.css';

type Props = PropsWithChildren<{
    center: ReadonlyKeyframes<Vector2D>;
    objects: Record<string, GameObjectInfo>;
    weaponEffectsRef: MutableRefObject<WeaponEffect[]>;
    showMenu: () => void;
}>;

export const ViewscreenDisplay: FC<Props> = (props) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useAnimationFrame();

    const timeProvider = useTimeProvider();

    const currentTime = timeProvider.getServerTime();

    let centerVector = interpolateVector(props.center, currentTime);

    const cellRadius = 32; // TODO: make this controllable? automatic?

    const { objects, weaponEffectsRef } = props;

    const drawExtraForeground = useCallback(
        (ctx: CanvasRenderingContext2D, _bounds: unknown, pixelSize: number) => {
            drawWeaponEffects(ctx, weaponEffectsRef.current, objects, timeProvider.getServerTime(), pixelSize, false);
        },
        [weaponEffectsRef, objects, timeProvider]
    );

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
                drawExtraForeground={drawExtraForeground}
            />

            {props.children}
        </Screen>
    );
};

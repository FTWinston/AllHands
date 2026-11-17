import colorPalettes from 'common-ui/ColorPalette.module.css';
import { classNames } from 'common-ui/utils/classNames';
import { describeShotResult, ShotResult, shotResultLifetime } from '../utils/shotResults';
import styles from './ShotToasts.module.css';

type Props = {
    /** The results to show, oldest first. Each is removed by its owner once it has expired: the toasts just fade out in the meantime. */
    results: readonly ShotResult[];
    /** The target currently shown. A result for any other target names it. */
    currentTargetId: string | null;
    /** The name of any target, including one that's no longer in the list. */
    getTargetName: (targetId: string) => string | undefined;
    /** Whether the toasts stay put, rather than fading out. For stories, where a static result would otherwise vanish. */
    persistent?: boolean;
};

const palettes = {
    hit: colorPalettes.good,
    absorbed: colorPalettes.primary,
    miss: colorPalettes.danger,
};

/**
 * Brief notices of whether each shot hit or missed, stacked with the newest at the bottom. Meant to sit just above the bottom edge of the target display.
 * The container is always present, so that screen readers announce each toast as it's added.
 */
export const ShotToasts = (props: Props) => (
    <div className={styles.anchor}>
        <div className={styles.toasts} role="status" aria-live="polite">
            {props.results.map(result => (
                <div
                    key={result.id}
                    className={classNames(styles.toast, palettes[result.outcome], props.persistent ? styles.persistent : undefined)}
                    // @ts-expect-error CSS custom property
                    style={{ '--lifetime': `${shotResultLifetime}ms` }}
                >
                    {describeShotResult(result, props.currentTargetId, props.getTargetName(result.targetId))}
                </div>
            ))}
        </div>
    </div>
);

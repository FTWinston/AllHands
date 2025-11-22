import { Cooldown } from 'common-types';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import { FC, JSX } from 'react';
import styles from './NumberIndicator.module.css';

type Props = {
    value: number;
    maxValue: number;
    generation?: Cooldown;
    name: string;
    description: JSX.Element;
    valueIcon: FC<{ className: string }>;
    maxIcon: FC<{ className: string }>;
};

// Adjust progress for elliptical display (aspect ratio 3.3:1)
// This compensates for the visual distortion where progress appears slower
// near the middle of top/bottom edges
function adjustProgressForIndicatorShape(fraction: number): number {
    if (fraction === 0 || fraction === 1) return fraction;

    const aspectRatio = 3.3; // width / height
    const a = aspectRatio; // semi-major axis (normalized)
    const b = 1; // semi-minor axis (normalized)

    // Convert fraction to parametric angle (0 to 2π)
    const targetAngle = fraction * 2 * Math.PI;

    // For an ellipse, we need to find the parametric angle that gives us
    // the desired visual angle when projected onto the perimeter
    // Using iterative approach to solve: atan2(b*sin(t), a*cos(t)) = targetAngle

    let t = targetAngle; // initial guess
    const iterations = 5; // Newton-Raphson iterations

    for (let i = 0; i < iterations; i++) {
        const sinT = Math.sin(t);
        const cosT = Math.cos(t);
        const currentAngle = Math.atan2(b * sinT, a * cosT);

        // Normalize angles to [0, 2π]
        const normalizedTarget = targetAngle;
        let normalizedCurrent = currentAngle < 0 ? currentAngle + 2 * Math.PI : currentAngle;

        const error = normalizedTarget - normalizedCurrent;

        // Derivative of atan2(b*sin(t), a*cos(t)) with respect to t
        const denominator = a * a * cosT * cosT + b * b * sinT * sinT;
        const derivative = (a * b) / denominator;

        t += error / derivative;
    }

    // Convert parametric angle back to fraction
    const adjustedFraction = (t < 0 ? t + 2 * Math.PI : t) / (2 * Math.PI);

    return adjustedFraction;
}

export const NumberIndicator: FC<Props> = (props) => {
    const ValueIcon = props.valueIcon;
    const MaxIcon = props.maxIcon;

    return (
        <InfoPopup
            className={styles.indicatorRoot}
            name={props.name}
            description={props.description}
        >
            <div className={styles.indicator}>
                <ValueIcon className={styles.icon} />

                <div className={styles.currentValue}>
                    {props.value}
                </div>
            </div>

            <div className={styles.separator} />

            <div className={styles.indicator}>
                <MaxIcon className={styles.icon} />

                <div className={styles.maxValue}>
                    {props.maxValue}
                </div>
            </div>

            <RadialProgress
                className={styles.progress}
                progress={props.generation}
                visualAdjustment={adjustProgressForIndicatorShape}
                title={`${props.name} generation`}
            />
        </InfoPopup>
    );
};

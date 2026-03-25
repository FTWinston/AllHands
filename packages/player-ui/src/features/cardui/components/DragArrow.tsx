import { FC } from 'react';
import styles from './DragArrow.module.css';

export type DragArrowTargetState = 'card' | 'alternate' | 'invalid' | 'none';

type Props = {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    targetState: DragArrowTargetState;
};

const ARROWHEAD_SIZE = 48;

const targetStateClass: Record<DragArrowTargetState, string> = {
    card: styles.card,
    alternate: styles.alternate,
    invalid: styles.invalid,
    none: styles.none,
};

export const DragArrow: FC<Props> = ({ startX, startY, endX, endY, targetState }) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 5) {
        return null;
    }

    // Control point for quadratic bezier — bow it slightly
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const perpX = -(dy / length);
    const perpY = dx / length;
    const bowAmount = length * 0.15;
    const cpX = midX + perpX * bowAmount;
    const cpY = midY + perpY * bowAmount;

    // Calculate arrowhead direction from the curve's tangent at t=1
    // For a quadratic bezier Q(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    // Tangent at t=1 = 2(P2 - P1)
    const tangentX = endX - cpX;
    const tangentY = endY - cpY;
    const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    const normTX = tangentX / tangentLen;
    const normTY = tangentY / tangentLen;

    // Shorten the path so the stem ends at the middle of the arrowhead
    const stemEndX = endX - normTX * ARROWHEAD_SIZE * 0.5;
    const stemEndY = endY - normTY * ARROWHEAD_SIZE * 0.5;

    const arrowLeft = {
        x: endX - normTX * ARROWHEAD_SIZE + normTY * ARROWHEAD_SIZE * 0.4,
        y: endY - normTY * ARROWHEAD_SIZE - normTX * ARROWHEAD_SIZE * 0.4,
    };
    const arrowRight = {
        x: endX - normTX * ARROWHEAD_SIZE - normTY * ARROWHEAD_SIZE * 0.4,
        y: endY - normTY * ARROWHEAD_SIZE + normTX * ARROWHEAD_SIZE * 0.4,
    };
    const arrowNotch = {
        x: endX - normTX * ARROWHEAD_SIZE * 0.8,
        y: endY - normTY * ARROWHEAD_SIZE * 0.8,
    };

    return (
        <svg className={`${styles.arrow} ${targetStateClass[targetState]}`} viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}>
            <path
                className={styles.line}
                d={`M ${startX} ${startY} Q ${cpX} ${cpY} ${stemEndX} ${stemEndY}`}
            />
            <polygon
                className={styles.head}
                points={`${endX},${endY} ${arrowLeft.x},${arrowLeft.y} ${arrowNotch.x},${arrowNotch.y} ${arrowRight.x},${arrowRight.y}`}
            />
        </svg>
    );
};

import type { FieldInfo } from '../types/FieldInfo';
import type { Vector2D } from '../types/Vector2D';

/** Whether a point is inside a field's oval. */
export function isInsideField(field: Pick<FieldInfo, 'x' | 'y' | 'angle' | 'radiusX' | 'radiusY'>, point: Vector2D): boolean {
    const dx = point.x - field.x;
    const dy = point.y - field.y;

    // The oval's axes in world space: its long axis points along `angle` (which is measured the opposite way round to the y axis), and its short axis is perpendicular to that.
    const cos = Math.cos(field.angle);
    const sin = Math.sin(field.angle);
    const along = dx * cos - dy * sin;
    const across = dx * sin + dy * cos;

    return (along / field.radiusX) ** 2 + (across / field.radiusY) ** 2 <= 1;
}

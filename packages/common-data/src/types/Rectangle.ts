import { Vector2D } from './Vector2D';

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function isInRectangle(bounds: Rectangle, point: Vector2D) {
    if (point.x < bounds.x || point.y < bounds.y) {
        return false;
    }

    if (point.x > bounds.x + bounds.width) {
        return false;
    }

    if (point.y > bounds.y + bounds.height) {
        return false;
    }

    return true;
}

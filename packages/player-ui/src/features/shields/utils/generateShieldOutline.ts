import ClipperLib from 'clipper-lib';
import { svgPathProperties } from 'svg-path-properties';

/**
 * Builds the outline that a ship's shields are drawn along: one closed path around its whole hull, a little way out from it.
 * This only runs in tests, which write the results to shieldOutlines.generated.ts (npm run generate:shield-outlines), so the game never loads the geometry libraries it uses.
 */

/** How far the outline sits outside the hull's lines, in the ship drawings' units (each is 512 across). */
const margin = 32;

/** Gaps and dents in the hull narrower than about twice this are bridged, so the outline doesn't follow every notch, or split around separate parts. */
const smoothing = 50;

/** Distance between the points sampled along a curved or long hull line. */
const sampleSpacing = 2;

/** Clipper works in integers, so coordinates are scaled up by this much while it works on them. */
const scale = 100;

/** Ships point to the right, along this line. */
const centreY = 256;

type Point = ClipperLib.IntPoint;

type HullShape = {
    points: Point[];
    closed: boolean;
};

/** The outline path for the ship drawing in this svg source, starting at its nose. */
export function generateShieldOutline(svg: string): string {
    const hull = /<g class="hull"([^>]*)>([\s\S]*?)<\/g>/.exec(svg);
    if (!hull) {
        throw new Error('Ship drawing has no hull group');
    }

    const strokeWidth = Number(readAttributes(hull[1])['stroke-width'] ?? 16);

    const grow = new ClipperLib.ClipperOffset(2, 0.25 * scale);
    for (const shape of readHullShapes(hull[2])) {
        if (shape.closed) {
            // Every closed shape counts as solid, even one cut out of another (such as a ring's middle), as the outline only goes round the outside.
            if (!ClipperLib.Clipper.Orientation(shape.points)) {
                shape.points.reverse();
            }
            grow.AddPath(shape.points, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
        } else {
            grow.AddPath(shape.points, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenRound);
        }
    }

    // Grow past the margin, then shrink back to it, to fill in gaps narrower than the smoothing distance.
    const grown: Point[][] = [];
    grow.Execute(grown, (strokeWidth / 2 + margin + smoothing) * scale);

    const shrink = new ClipperLib.ClipperOffset(2, 0.25 * scale);
    shrink.AddPaths(grown.filter(path => ClipperLib.Clipper.Orientation(path)), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
    const shrunk: Point[][] = [];
    shrink.Execute(shrunk, -smoothing * scale);

    const outer = shrunk
        .filter(path => ClipperLib.Clipper.Orientation(path))
        .sort((a, b) => Math.abs(ClipperLib.Clipper.Area(b)) - Math.abs(ClipperLib.Clipper.Area(a)))[0];

    const simplified = ClipperLib.JS.Lighten(outer, 0.4 * scale) as Point[];
    const points = removeRepeats(simplified.map(point => ({ X: Math.round(point.X / scale), Y: Math.round(point.Y / scale) })));

    return toPathData(startAtNose(points));
}

function readAttributes(source: string): Record<string, string> {
    return Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
}

function readHullShapes(source: string): HullShape[] {
    const shapes: HullShape[] = [];

    for (const [, tag, attributeSource] of source.matchAll(/<(\w+)\b([^>]*?)\/?>/g)) {
        const attributes = readAttributes(attributeSource);
        const number = (name: string) => Number(attributes[name] ?? 0);

        switch (tag) {
            case 'path':
                shapes.push(...readPathData(attributes.d));
                break;
            case 'polygon':
            case 'polyline':
                shapes.push({ points: readPointList(attributes.points), closed: tag === 'polygon' });
                break;
            case 'line':
                shapes.push({ points: [toPoint(number('x1'), number('y1')), toPoint(number('x2'), number('y2'))], closed: false });
                break;
            case 'circle':
                shapes.push({ points: sampleEllipse(number('cx'), number('cy'), number('r'), number('r')), closed: true });
                break;
            case 'ellipse':
                shapes.push({ points: sampleEllipse(number('cx'), number('cy'), number('rx'), number('ry')), closed: true });
                break;
            case 'rect': {
                const [x, y, width, height] = [number('x'), number('y'), number('width'), number('height')];
                shapes.push({ points: [toPoint(x, y), toPoint(x + width, y), toPoint(x + width, y + height), toPoint(x, y + height)], closed: true });
                break;
            }
            default:
                throw new Error(`Can't outline a <${tag}> in a ship's hull`);
        }
    }

    return shapes;
}

/** Each sub-path of the path data, sampled along its length. */
function readPathData(data: string): HullShape[] {
    if (/m/.test(data)) {
        throw new Error('Hull paths must only use absolute moves (M), so they can be split into sub-paths');
    }

    return data.split(/(?=M)/).filter(part => part.trim()).map((part) => {
        const properties = new svgPathProperties(part);
        const length = properties.getTotalLength();
        const count = Math.max(8, Math.ceil(length / sampleSpacing));
        const points: Point[] = [];
        for (let i = 0; i <= count; i++) {
            const { x, y } = properties.getPointAtLength(length * i / count);
            points.push(toPoint(x, y));
        }
        return { points, closed: /z\s*$/i.test(part) };
    });
}

function readPointList(list: string): Point[] {
    const values = list.trim().split(/[\s,]+/).map(Number);
    const points: Point[] = [];
    for (let i = 0; i + 1 < values.length; i += 2) {
        points.push(toPoint(values[i], values[i + 1]));
    }
    return points;
}

function sampleEllipse(cx: number, cy: number, rx: number, ry: number): Point[] {
    const count = Math.max(16, Math.ceil(2 * Math.PI * Math.max(rx, ry) / sampleSpacing));
    return Array.from({ length: count }, (_, i) => {
        const angle = 2 * Math.PI * i / count;
        return toPoint(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle));
    });
}

function toPoint(x: number, y: number): Point {
    return { X: Math.round(x * scale), Y: Math.round(y * scale) };
}

function removeRepeats(points: Point[]): Point[] {
    return points.filter((point, i) => {
        const previous = points[(i + points.length - 1) % points.length];
        return point.X !== previous.X || point.Y !== previous.Y;
    });
}

/**
 * Start the outline at the ship's nose: where it crosses the centreline furthest forward, adding a point there if there isn't one.
 * Then run it clockwise on screen, so shields drain evenly down both sides.
 */
function startAtNose(points: Point[]): Point[] {
    let nose: { index: number; point: Point } | null = null;

    points.forEach((from, i) => {
        const to = points[(i + 1) % points.length];
        if ((from.Y - centreY) * (to.Y - centreY) > 0 || from.Y === to.Y) {
            return;
        }
        const x = Math.round(from.X + (to.X - from.X) * (centreY - from.Y) / (to.Y - from.Y));
        if (!nose || x > nose.point.X) {
            nose = { index: i + 1, point: { X: x, Y: centreY } };
        }
    });

    if (!nose) {
        throw new Error('Shield outline doesn\'t cross the centreline');
    }

    const { index, point } = nose as { index: number; point: Point };
    let ordered = removeRepeats([point, ...points.slice(index), ...points.slice(0, index)]);

    // With y pointing down, a positive shoelace area means the points run clockwise on screen.
    const area = ordered.reduce((sum, point, i) => {
        const next = ordered[(i + 1) % ordered.length];
        return sum + point.X * next.Y - next.X * point.Y;
    }, 0);
    if (area < 0) {
        ordered = [ordered[0], ...ordered.slice(1).reverse()];
    }

    return ordered;
}

function toPathData(points: Point[]): string {
    return `M${points.map(point => `${point.X} ${point.Y}`).join('L')}Z`;
}

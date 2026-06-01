import { IArray } from '@colyseus/react';

export type Keyframe<T> = Omit<T, 'time'> & {
    time: number;
};

/**
 * Like Array<T>, but remove concat and array-returning methods, so it can work with Colyseus ArraySchema.
 */
type IEditableArray<T> = Omit<Array<T>, 'concat' | 'reverse' | 'sort' | 'fill' | 'copyWithin'>;

export type Keyframes<T> = IEditableArray<Keyframe<T>>;

export type ReadonlyKeyframes<T> = IArray<Keyframe<T>>;

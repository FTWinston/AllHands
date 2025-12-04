export interface Keyframe<T> {
    time: number;
    val: T;
}

export type Keyframes<T> = Keyframe<T>[];

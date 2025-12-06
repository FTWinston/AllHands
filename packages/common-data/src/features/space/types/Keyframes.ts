export type Keyframe<T> = Omit<T, 'time'> & {
    time: number;
};

export type Keyframes<T> = Keyframe<T>[];

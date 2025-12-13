import { MinimalArray, MinimalReadonlyArray } from 'src/types/MinimalArray';

export type Keyframe<T> = Omit<T, 'time'> & {
    time: number;
};

export type Keyframes<T> = MinimalArray<Keyframe<T>>;

export type ReadonlyKeyframes<T> = MinimalReadonlyArray<Keyframe<T>>;

export type Keyframe<T> = Omit<T, 'time'> & {
    time: number;
};

// Take Array<T>, but remove concat and array-returning methods, so it can work with Colyseus ArraySchema.
type ArrayLikeWithoutConcat<T> = Omit<Array<T>, 'concat' | 'reverse' | 'sort' | 'fill' | 'copyWithin'>;

export type Keyframes<T> = ArrayLikeWithoutConcat<Keyframe<T>>;

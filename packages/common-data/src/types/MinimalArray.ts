/**
 * Like Array<T>, but remove concat and array-returning methods, so it can work with Colyseus ArraySchema.
 */
export type MinimalArray<T> = Omit<Array<T>, 'concat' | 'reverse' | 'sort' | 'fill' | 'copyWithin'>;

/**
 * Like Array<T>, but remove concat and array-returning methods, so it can work with Colyseus ArraySchema.
 */
export type MinimalArray<T> = Omit<Array<T>, 'concat' | 'reverse' | 'sort' | 'fill' | 'copyWithin'>;

/**
 * Like ReadonlyArray<T>, but remove concat, so it's a narrower version of @see MinimalArray.
 */
export type MinimalReadonlyArray<T> = Omit<ReadonlyArray<T>, 'concat'>;

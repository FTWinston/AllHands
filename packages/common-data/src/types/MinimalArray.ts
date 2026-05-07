/**
 * Like Array<T>, but remove concat and array-returning methods, so it can work with Colyseus ArraySchema.
 */
export type MinimalArray<T> = Omit<Array<T>, 'concat' | 'reverse' | 'sort' | 'fill' | 'copyWithin'>;

/**
 * Like ReadonlyArray<T>, but remove concat, so it's a narrower version of @see MinimalArray.
 */
export type MinimalReadonlyArray<T> = Omit<ReadonlyArray<T>, 'concat'>;

/**
 * Like ReadonlyMap<K, V>, but uses IterableIterator instead of MapIterator,
 * so it can work with Colyseus MapSchema.
 */
export type MinimalReadonlyMap<K, V> = {
    get(key: K): V | undefined;
    has(key: K): boolean;
    readonly size: number;
    forEach(callbackfn: (value: V, key: K) => void, thisArg?: any): void;
    entries(): IterableIterator<[K, V]>;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
};

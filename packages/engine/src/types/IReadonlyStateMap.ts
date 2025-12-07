export interface IReadonlyStateMap<T> {
    get(key: string): T | undefined;
    has(key: string): boolean;
    readonly size: number;
    forEach(callback: (value: T, key: string) => void): void;

    // Use IterableIterator (what MapSchema provides)
    // instead of MapIterator (what ReadonlyMap demands)
    [Symbol.iterator](): IterableIterator<[string, T]>;
}

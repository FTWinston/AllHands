import { MinimalArray, MinimalReadonlyArray } from './MinimalArray';

export interface IRandom {
    getFloat(min: number, max: number): number;

    getBoolean(chanceOfTrue: number): boolean;

    getInt(maxExclusive: number): number;

    pick<T>(values: MinimalReadonlyArray<T>): T;

    insert<T>(array: MinimalArray<T>, value: T): void;

    delete<T>(values: MinimalArray<T>): T;

    shuffle(items: MinimalArray<unknown>): void;
};

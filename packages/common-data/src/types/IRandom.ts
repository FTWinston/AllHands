import { IArray } from '@colyseus/react';

export interface IRandom {
    getFloat(min: number, max: number): number;

    getBoolean(chanceOfTrue: number): boolean;

    getInt(maxExclusive: number): number;

    pick<T>(values: IArray<T>): T;

    insert<T>(array: IArray<T>, value: T): void;

    delete<T>(values: IArray<T>): T;

    shuffle(items: IArray<unknown>): void;
};

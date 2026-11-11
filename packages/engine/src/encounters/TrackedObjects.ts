import type { GameObject } from 'src/state/GameObject';

/**
 * Some of an encounter's objects, which drop out of it as they leave the game (see `Encounter.track`),
 * so an encounter never has to prune its own lists.
 */
export class TrackedObjects<T extends GameObject> implements Iterable<T> {
    private items: T[] = [];

    get size(): number {
        return this.items.length;
    }

    /** The objects, in the order they were added. */
    get all(): readonly T[] {
        return this.items;
    }

    add(...objects: T[]): void {
        for (const object of objects) {
            if (!this.items.includes(object)) {
                this.items.push(object);
            }
        }
    }

    /** Returns whether it was there to remove. */
    remove(object: GameObject): boolean {
        const index = this.items.indexOf(object as T);
        if (index === -1) {
            return false;
        }

        this.items.splice(index, 1);
        return true;
    }

    has(object: GameObject): boolean {
        return this.items.includes(object as T);
    }

    find(predicate: (object: T) => boolean): T | undefined {
        return this.items.find(predicate);
    }

    [Symbol.iterator](): Iterator<T> {
        // A copy, so that objects can leave the game while they're being gone through.
        return [...this.items][Symbol.iterator]();
    }
}

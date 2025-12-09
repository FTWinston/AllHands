import { IRandom } from 'src/types/IRandom';

export class Random implements IRandom {
    constructor(private random: () => number) {
    }

    getFloat(min = 0, max = 1) {
        return min + this.random() * (max - min);
    }

    getBoolean(chanceOfTrue = 0.5) {
        return this.random() <= chanceOfTrue;
    }

    getInt(maxExclusive: number) {
        return Math.floor(this.random() * maxExclusive);
    }

    pick<T>(values: T[]): T {
        if (values.length === 0) {
            throw new Error('pick passed an empty array');
        }

        return values[this.getInt(values.length)];
    }

    insert<T>(array: T[], value: T) {
        const index = this.getInt(array.length + 1);
        array.splice(index, 0, value);
    }

    delete<T>(values: T[]): T {
        if (values.length === 0) {
            throw new Error('delete passed an empty array');
        }

        const index = this.getInt(values.length);
        const result = values[index];
        values.splice(index, 1);
        return result;
    }

    shuffle(items: unknown[]) {
        let currentIndex = items.length;
        let temporaryValue: unknown;
        let randomIndex: number;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = this.getInt(currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = items[currentIndex];
            items[currentIndex] = items[randomIndex];
            items[randomIndex] = temporaryValue;
        }
    }
}

/**
 * A getter that can have handlers added to modify its output.
 * Each handler receives the value returned by the previous one (or the initial value for the first),
 * and its own return value is passed along to the next, until the last one is returned.
 * Includes an optional callback for when any handlers are added or removed, so that the getter can be re-evaluated if necessary.
 */
export class InterceptableGetter<TOutput> {
    private handlers: Map<string, (output: TOutput) => TOutput> = new Map();

    constructor(
        private readonly defaultGetter: () => TOutput,
        private readonly handlerChangeCallback?: () => void
    ) {}

    public addHandler(id: string, filter: (output: TOutput) => TOutput) {
        this.handlers.set(id, filter);
        this.handlerChangeCallback?.();
    }

    public removeHandler(id: string): boolean {
        const returnValue = this.handlers.delete(id);
        this.handlerChangeCallback?.();
        return returnValue;
    }

    public hasHandler(id: string): boolean {
        return this.handlers.has(id);
    }

    public invoke(): TOutput {
        let output = this.defaultGetter();

        for (const filter of this.handlers.values()) {
            output = filter(output);
        }

        return output;
    }
}

interface SetterInterceptor<TInput> {
    preventDefault: boolean;
    handle: (input: TInput) => TInput;
}

/**
 * An setter that can have handlers added to modify its input.
 * Handlers can be set to prevent the default action of the setter.
 * Each handler receives the value returned by the previous one (or the initial value for the first),
 * and its own return value is passed along to the next, and eventually to the default action, unless prevented.
 */
export class InterceptableSetter<TInput> {
    private handlers: Map<string, SetterInterceptor<TInput>> = new Map();

    constructor(private readonly defaultSetter?: (input: TInput) => void) {}

    public addHandler(
        id: string,
        preventDefault: boolean,
        handle: (input: TInput) => TInput
    ): this {
        this.handlers.set(id, { preventDefault, handle });
        return this;
    }

    public removeHandler(id: string): boolean {
        return this.handlers.delete(id);
    }

    public hasHandler(id: string): boolean {
        return this.handlers.has(id);
    }

    /**
     * Invokes the action, threading the value through registered handlers.
     * @returns boolean - true if defaultAction executed, false if prevented.
     */
    public invoke(input: TInput): boolean {
        let defaultPrevented = false;

        for (const { preventDefault, handle } of this.handlers.values()) {
            if (preventDefault) {
                defaultPrevented = true;
            }
            input = handle(input);
        }

        if (defaultPrevented) {
            return false;
        }

        if (this.defaultSetter) {
            this.defaultSetter(input);
        }

        return true;
    }
}

interface ActionInterceptor {
    preventDefault: boolean;
    handle: () => void;
}

/**
 * An action that can have handlers added and removed, and can have all bound handlers triggered.
 * Each handler receives the value returned by the previous one (or the initial value for the first),
 * and its own return value is passed along to the next, and eventually to the default action, unless prevented.
 * Handlers can be set to prevent the default action of the event.
 */
export class InterceptableAction {
    private handlers: Map<string, ActionInterceptor> = new Map();

    constructor(private readonly defaultAction?: () => void) {}

    public addHandler(
        id: string,
        preventDefault: boolean,
        handle: () => void
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
    public invoke(): boolean {
        let defaultPrevented = false;

        for (const { preventDefault, handle } of this.handlers.values()) {
            if (preventDefault) {
                defaultPrevented = true;
            }
            handle();
        }

        if (defaultPrevented) {
            return false;
        }

        if (this.defaultAction) {
            this.defaultAction();
        }

        return true;
    }
}

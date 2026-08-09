interface Listener<T> {
    preventDefault: boolean;
    listener: (args: T) => T;
}

/**
 * An event that can have listeners added and removed, and can have all bound listeners be triggered.
 * Each listener receives the value returned by the previous one (or the initial value for the first),
 * and its own return value is passed along to the next, and eventually to the default action, unless prevented.
 * Listeners can be set to prevent the default action of the event.
 */
export class BindableEvent<T = void> {
    constructor(private readonly defaultAction?: (args: T) => void) {}

    private listeners: Map<string, Listener<T>> = new Map();

    public addListener(id: string, preventDefault: boolean, listener: (args: T) => T) {
        this.listeners.set(id, { preventDefault, listener });
    }

    public removeListener(id: string) {
        this.listeners.delete(id);
    }

    public hasListener(id: string): boolean {
        return this.listeners.has(id);
    }

    public listenerCount(): number {
        return this.listeners.size;
    }

    /**
     * Triggers the event, threading the value through each listener in turn, then the default action, unless prevented.
     */
    public trigger(value: T): void {
        let defaultPrevented = false;

        for (const { preventDefault, listener } of this.listeners.values()) {
            if (preventDefault) {
                defaultPrevented = true;
            }

            value = listener(value) as T;
        }

        if (!defaultPrevented && this.defaultAction) {
            this.defaultAction(value);
        }
    }
}

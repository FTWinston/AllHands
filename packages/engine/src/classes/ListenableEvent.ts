/**
 * An event that can have listeners added and removed, and can have all bound handlers triggered.
 */
export class ListenableEvent<TArg = void> {
    private listeners: Map<string, (arg: TArg) => void> = new Map();

    /**
     * Adds a handler that will be invoked.
     */
    public addListener(id: string, handle: (arg: TArg) => void): this {
        this.listeners.set(id, handle);
        return this;
    }

    public removeListener(id: string): boolean {
        return this.listeners.delete(id);
    }

    public hasListener(id: string): boolean {
        return this.listeners.has(id);
    }

    /**
     * Calls every registered listener.
     */
    public triggerListeners(arg: TArg) {
        for (const handle of this.listeners.values()) {
            handle(arg);
        }
    }
}

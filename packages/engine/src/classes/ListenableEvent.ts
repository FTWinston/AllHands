/**
 * An event that can have listeners added and removed, and can have all bound handlers triggered.
 */
export class ListenableEvent {
    private listeners: Map<string, () => void> = new Map();

    /**
     * Adds a handler that will be invoked.
     */
    public addListener(id: string, handle: () => void): this {
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
    public triggerListeners() {
        for (const handle of this.listeners.values()) {
            handle();
        }
    }
}

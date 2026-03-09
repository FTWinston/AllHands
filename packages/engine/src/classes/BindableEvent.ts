interface Listener {
    preventDefault: boolean;
    listener: (...args: unknown[]) => unknown;
}

/**
 * An event that can have listeners added and removed, and can have all bound listeners be triggered, with arguments.
 * Listeners can be set to prevent the default action of the event, which is indicated by the return value of trigger.
 */
export class BindableEvent<T extends (...args: unknown[]) => unknown> {
    public BindableEvent() {

    }

    private listeners: Map<string, Listener> = new Map();

    public addListener(id: string, preventDefault: boolean, listener: T) {
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
     * Triggers the event, calling all listeners with the provided arguments.
     * Returns true if any listener had preventDefault set to true, false otherwise.
     */
    public trigger(...args: Parameters<T>): boolean {
        let defaultPrevented = false;

        for (const { preventDefault, listener } of this.listeners.values()) {
            if (preventDefault) {
                defaultPrevented = true;
            }

            listener(...args);
        }

        return defaultPrevented;
    }
}

/**
 * An action that can have interceptors and listeners added and removed, and can have all bound handlers triggered.
 * Interceptors are invoked before the default action and can prevent it from executing by returning true.
 * Listeners are invoked after the default action.
 */
export class InterceptableAction {
    private interceptors: Map<string, () => boolean | undefined> = new Map();
    private listeners: Map<string, () => void> = new Map();

    constructor(private readonly defaultAction?: () => void) {}

    public addInterceptor(
        id: string,
        handle: () => boolean | undefined
    ): this {
        this.interceptors.set(id, handle);
        return this;
    }

    public removeInterceptor(id: string): boolean {
        return this.interceptors.delete(id);
    }

    public hasInterceptor(id: string): boolean {
        return this.interceptors.has(id);
    }

    /**
     * Adds a handler that will be invoked after the main handlers and default action.
     */
    public addListener(id: string, handle: () => void): this {
        this.listeners.set(id, handle);
        return this;
    }

    public removeListener(id: string): boolean {
        return this.listeners.delete(id);
    }

    public hasHandler(id: string): boolean {
        return this.listeners.has(id);
    }

    /**
     * Invokes the action, threading the value through registered handlers.
     * @returns boolean - true if defaultAction executed, false if prevented.
     */
    public invoke(): boolean {
        let defaultPrevented = false;

        for (const handle of this.interceptors.values()) {
            if (handle()) {
                defaultPrevented = true;
            }
        }

        if (defaultPrevented) {
            return false;
        }

        if (this.defaultAction) {
            this.defaultAction();
        }

        for (const handle of this.listeners.values()) {
            handle();
        }

        return true;
    }
}

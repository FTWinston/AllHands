import { ListenableEvent } from './ListenableEvent';

/**
 * An action that can have interceptors and listeners added and removed, and can have all bound handlers triggered.
 * Interceptors are invoked before the default action and can prevent it from executing by returning true.
 * Listeners are invoked after the default action.
 */
export class InterceptableAction extends ListenableEvent {
    private interceptors: Map<string, () => boolean | undefined> = new Map();

    constructor(private readonly defaultAction?: () => void) {
        super();
    }

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

        this.defaultAction?.();

        this.triggerListeners();

        return true;
    }
}

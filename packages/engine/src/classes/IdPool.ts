import { IdProvider } from 'src/types/IdProvider';

export class IdPool implements IdProvider {
    private availableIdQueue: string[] = [];
    private nextNewId: number = 1;
    private minBuffer: number;

    /**
     * @param minBuffer The minimum number of IDs to keep ready in the pool.
     * Higher numbers increase the delay before a released ID is reused.
     */
    constructor(minBuffer: number = 50) {
        this.minBuffer = minBuffer;
        this.ensureBuffer();
    }

    /**
     * Retrieves an ID from the front of the queue.
     * If the queue is low, it expands with fresh IDs first.
     */
    public getId(): string {
        // 1. Ensure the pool respects the minimum buffer size
        this.ensureBuffer();

        // 2. Shift the 'oldest' ID from the front of the array
        const id = this.availableIdQueue.shift();

        // Safety check (though ensureBuffer guarantees this won't happen)
        if (id === undefined) {
            throw new Error('ID Pool failed to generate an ID.');
        }

        return id.toString();
    }

    /**
     * Releases an ID back into the pool.
     * The ID is added to the end of the queue to prevent immediate reuse.
     */
    public releaseId(id: string): void {
        this.availableIdQueue.push(id);
    }

    /**
     * Ensure the buffer has sufficient size to prevent IDs from being reused immediately after release.
     */
    private ensureBuffer(): void {
        while (this.availableIdQueue.length <= this.minBuffer) {
            this.availableIdQueue.push((this.nextNewId++).toString());
        }
    }
}

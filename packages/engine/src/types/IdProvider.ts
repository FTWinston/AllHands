export interface IdProvider {
    getId(): string;
    releaseId(id: string): void;
}

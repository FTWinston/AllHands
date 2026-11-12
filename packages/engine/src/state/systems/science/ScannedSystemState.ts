import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ScannedBaseInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ListenableEvent } from 'src/classes/ListenableEvent';
import { CardState } from 'src/state/CardState';
import { mirrorCards } from '../engineer/mirrorCards';
import type { CrewSystemState } from '../CrewSystemState';

/**
 * What science sees of one crew system on the ship it's scanning: its power, and its hand once that's read.
 * Each crew system's scan adds what's particular to that system. A scan keeps itself up to date with its system while it's listening.
 */
export abstract class ScannedSystemState<TSource extends CrewSystemState = CrewSystemState> extends Schema implements ScannedBaseInfo {
    /** `listenerId` identifies the scanning ship's listeners on the scanned system, so they can be removed again. */
    constructor(protected readonly source: TSource, private readonly listenerId: string) {
        super();
        this.targetId = source.getShip().id;
    }

    @type('string') targetId: string = '';
    @type('uint8') power: number = 0;
    /** Copies of the cards in the system's hand, once science has read it. Null until then. */
    @type([CardState]) hand: ArraySchema<CardState> | null = null;

    /** Where the scanned system sits on a scan display of its ship. */
    get scannedSystemIndex() {
        return this.source.scannedSystemIndex;
    }

    /** The events on which this scan's system announces a change that the scan shows. */
    protected get changeEvents(): ListenableEvent[] {
        return [this.source.scienceScanDataChanged];
    }

    /** Copy everything shown from the scanned system, and go on doing so whenever it changes, until `stopListening`. */
    startListening() {
        this.update();

        for (const event of this.changeEvents) {
            event.addListener(this.listenerId, () => this.update());
        }
    }

    stopListening() {
        for (const event of this.changeEvents) {
            event.removeListener(this.listenerId);
        }
    }

    /** Start showing the system's hand. Returns false if it's already shown. */
    readHand(): boolean {
        if (this.hand) {
            return false;
        }

        this.hand = new ArraySchema<CardState>();
        this.update();
        return true;
    }

    private update() {
        this.power = this.source.powerLevel;

        // Once science has read the hand, it sees each card as it's drawn or played.
        if (this.hand) {
            mirrorCards(this.source.hand, this.hand);
        }

        this.copySystemData(this.source);
    }

    /** Copy what's particular to this kind of system. */
    protected abstract copySystemData(source: TSource): void;
}

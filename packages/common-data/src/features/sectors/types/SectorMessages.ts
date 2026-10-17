import type { DevEncounterInfo } from './DevEncounterInfo';
import type { EncounterId } from './SectorNodeInfo';

export interface DevLoadEncounterPayload {
    encounterId: EncounterId;
}

export interface PlayNonEncounterCardPayload {
    cardId: number;
}

/** Client -> server; payload is `undefined` where the value is `undefined`. Route cards are played via `playNonEncounterCard`, other cards via `playCard`. */
export interface SectorClientMessages {
    /** Tactical dismisses the sector intro/outro message. */
    // `undefined` is the convention for messages that carry no payload.
    dismissMessage: undefined;
    playNonEncounterCard: PlayNonEncounterCardPayload;
    devLoadEncounter: DevLoadEncounterPayload;
}

/** Server -> client, sent to a client when it joins. */
export interface SectorServerMessages {
    devEncounterList: DevEncounterInfo[];
}

import type { DevEncounterInfo } from './DevEncounterInfo';
import type { EncounterId } from './SectorNodeInfo';

export interface DevLoadEncounterPayload {
    encounterId: EncounterId;
}

/** Client -> server; payload is `undefined` where the value is `undefined`. Route and Warp Away cards are played via `playCard`. */
export interface SectorClientMessages {
    /** Tactical dismisses the sector intro/outro message. */
    dismissMessage: undefined;
    devLoadEncounter: DevLoadEncounterPayload;
}

/** Server -> client, sent to a client when it joins. */
export interface SectorServerMessages {
    devEncounterList: DevEncounterInfo[];
}

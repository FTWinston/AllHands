import { type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';
import { ScannedSystemState } from './ScannedSystemState';
import type { ScienceState } from './ScienceState';

export class ScannedScienceState extends ScannedSystemState<ScienceState> implements ScannedScienceInfo {
    @type(CardState) deflectorCard: CardState | null = null;
    @type('string') scanSystem: ShipSystem | null = null;

    protected override copySystemData(source: ScienceState) {
        this.deflectorCard = source.deflectorCard.cloneCard() ?? null;
    }
}

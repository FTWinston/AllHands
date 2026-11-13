import { type } from '@colyseus/schema';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';
import { CooldownState } from 'src/state/CooldownState';
import { ScannedSystemState } from './ScannedSystemState';
import type { HelmState } from '../HelmState';

export class ScannedHelmState extends ScannedSystemState<HelmState> implements ScannedHelmInfo {
    @type(CardState) activeManeuver: CardState | null = null;
    @type(CooldownState) maneuverProgress: CooldownState | null = null;
    @type('number') evasionChance: number = 0;

    protected override copySystemData(source: HelmState) {
        this.activeManeuver = source.activeManeuver?.card?.cloneCard() ?? null;
        this.maneuverProgress = source.activeManeuver
            ? new CooldownState(source.activeManeuver.startTime, source.activeManeuver.endTime)
            : null;
        this.evasionChance = source.activeManeuver?.card?.getParameter('evasion') ?? 0;
    }
}

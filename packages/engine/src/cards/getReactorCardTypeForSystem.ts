import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

export function getReactorCardTypeForSystem(system: ShipSystem): CardType {
    switch (system) {
        case 'hull':
            return 'reactorPowerHull';
        case 'reactor':
            return 'reactorPowerReactor';
        case 'helm':
            return 'reactorPowerHelm';
        case 'tactical':
            return 'reactorPowerTactical';
        case 'science':
            return 'reactorPowerScience';
        case 'engineer':
            return 'reactorPowerEngineer';
        default:
            throw new Error(`Unknown system: ${system}`);
    }
}

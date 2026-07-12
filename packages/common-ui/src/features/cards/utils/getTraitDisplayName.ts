import { CardTrait } from 'common-data/features/cards/types/CardTrait';

/**
 * Converts a camelCase trait identifier to a user-friendly display string.
 */
export function getTraitDisplayName(trait: CardTrait): string {
    switch (trait) {
        case 'expendable':
            return 'Expendable';
        case 'primary':
            return 'Primary';
        case 'energyWeapon':
            return 'Energy weapon';
        case 'torpedoWeapon':
            return 'Torpedo weapon';
        case 'area':
            return 'Area';
        case 'cumbersome':
            return 'Cumbersome';
        case 'draining':
            return 'Draining';
        case 'dampening':
            return 'Dampening';
        case 'persistent':
            return 'Persistent';
        case 'disabling':
            return 'Disabling';
        case 'penetrating':
            return 'Penetrating';
        case 'disrupting':
            return 'Disrupting';
        default:
            throw new Error(`Card trait not found: ${trait as never}`);
    }
}

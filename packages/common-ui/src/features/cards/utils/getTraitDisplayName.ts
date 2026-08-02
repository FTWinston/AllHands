import { AssignableDeflectorEffectDelivery, AssignableDeflectorEffectSubstance, AssignableDeflectorEffectModifier } from 'common-data/features/cards/types/CardDefinition';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';

export type DisplayableTrait = CardTrait
    | AssignableDeflectorEffectModifier
    | AssignableDeflectorEffectSubstance
    | AssignableDeflectorEffectDelivery;

/**
 * Converts a camelCase trait identifier to a user-friendly display string.
 */
export function getTraitDisplayName(trait: DisplayableTrait): string {
    switch (trait) {
        case 'expendable':
            return 'Expendable';
        case 'primary':
            return 'Primary';

        // Weapon traits
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

        // Deflector effects
        case 'Phased':
            return 'Modifier: Phased';
        case 'Coherent':
            return 'Modifier: Coherent';
        case 'Inverted':
            return 'Modifier: Inverted';
        case 'Antiproton':
            return 'Substance: Antiproton';
        case 'Tetryon':
            return 'Substance: Tetryon';
        case 'Chroniton':
            return 'Substance: Chroniton';
        case 'Polaron':
            return 'Substance: Polaron';
        case 'Beam':
            return 'Delivery: Beam';
        case 'Pulse':
            return 'Delivery: Pulse';
        case 'Burst':
            return 'Delivery: Burst';

        default:
            throw new Error(`Card trait not found: ${trait satisfies never}`);
    }
}

import { CardTrait } from 'common-data/features/cards/types/CardTrait';

export const getTraitDescription = (trait: CardTrait): string => {
    switch (trait) {
        case 'primary':
            return 'Card returns to hand when played (if no other primary card in hand)';
        case 'expendable':
            return 'Card is destroyed when played (not added to discard pile).';
        case 'energyWeapon':
            return 'A weapon that fires a beam or pulse of energy';
        case 'torpedoWeapon':
            return 'A weapon that fires a projectile';
        case 'area':
            return 'Damage nearby targets';
        case 'cumbersome':
            return 'Needs to hold aim for 2 seconds';
        case 'draining':
            return 'Adds a power draining effect on target system';
        case 'dampening':
            return 'Extra reduction to shield power';
        case 'persistent':
            return 'Adds a damage over time effect to target system';
        case 'disabling':
            return 'Adds an effect that prevents the target system from playing cards';
        case 'penetrating':
            return 'Partly bypasses shields';
        case 'disrupting':
            return 'Adds a disrupted card to target system hand. Card deals damage when played.';
        default:
            throw new Error(`Card trait not found: ${trait as never}`);
    }
};

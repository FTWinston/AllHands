import { DisplayableTrait } from './getTraitDisplayName';

export const getTraitDescription = (trait: DisplayableTrait): string => {
    switch (trait) {
        case 'primary':
            return 'Card returns to hand when played (if no other primary card in hand)';
        case 'expendable':
            return 'Card is destroyed when played (not added to discard pile).';

        // Weapon traits
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

        // Deflector effects
        case 'Phased':
            return 'When slotted into the deflector, its effect bypasses shields and other barriers.';
        case 'Coherent':
            return 'When slotted into the deflector, its effect is amplified.';
        case 'Inverted':
            return 'When slotted into the deflector, its effect is reversed.';
        case 'Modulated':
            return 'When slotted into the deflector, its effect intensity varies rapidly.';
        case 'Antiproton':
            return 'When slotted into the deflector, its effect deals damage to affected objects.';
        case 'Tetryon':
            return 'When slotted into the deflector, its effect drains shields from affected ships.';
        case 'Chroniton':
            return 'When slotted into the deflector, its effect slows actions of affected ships.';
        case 'Graviton':
            return 'When slotted into the deflector, its effect pushes affected objects away from your ship.';
        case 'Polaron':
            return 'When slotted into the deflector, its effect drains power from the systems of affected ships.';
        case 'Beam':
            return 'When slotted into the deflector, fires a beam directly at a target when activated.';
        case 'Pulse':
            return 'When slotted into the deflector, emits a pulse in all directions when activated.';
        case 'Burst':
            return 'When slotted into the deflector, emits a slower-moving effect towards a target when activated.';
        case 'Field':
            return 'When slotted into the deflector, passively emits a continuous effect centered on your ship.';

        default:
            throw new Error(`Card trait not found: ${trait satisfies never}`);
    }
};

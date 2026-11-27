import { areaDamagePercent, areaRadius, drainingPowerLoss, persistentDamagePerTick } from 'common-data/features/cards/utils/weaponTraitStats';
import { dampeningDrainPercent, penetratingAbsorptionPercent } from 'common-data/features/ships/utils/shieldStats';
import { DisplayableTrait } from './getTraitDisplayName';

export const getTraitDescription = (trait: DisplayableTrait): string => {
    switch (trait) {
        case 'damaged':
            return 'Card cannot be used.';
        case 'stabilised':
            return 'Card functionality has been restored, but additional damage will make it critically damaged.';
        case 'critical':
            return 'Card cannot be used and cannot be stabilised.';
        case 'primary':
            return 'Card returns to hand when played, unless another copy of it is already there.';
        case 'expendable':
            return 'Card is destroyed when played (not added to the deck).';
        case 'unstable':
            return 'Card shuffles back into the deck when played, instead of going on the end.';
        case 'rechargeable':
            return 'Weapon can go on being charged after being fully charged, any number of times, even while it\'s active.';
        case 'energised':
            return 'Weapon is fully charged as soon as it\'s loaded, so it can\'t be modified.';
        case 'priority':
            return 'Cannot be discarded otherwise used, except by playing it.';
        case 'unplayable':
            return 'This card cannot be played.';
        case 'caught':
            return 'Your ship is in a tractor beam. Manoeuvre with high power to break free.';

        // Weapon traits
        case 'energyWeapon':
            return 'A weapon that fires a beam or pulse of energy';
        case 'torpedoWeapon':
            return 'A weapon that fires a projectile';
        case 'area':
            return `Other ships within ${areaRadius} of the target, apart from the one firing, take ${areaDamagePercent}% of the damage.`;
        case 'cumbersome':
            return 'Needs to hold aim for 2 seconds';
        case 'draining':
            return `The system hit loses ${drainingPowerLoss} power for a while.`;
        case 'dampening':
            return `Drains the target's shields by ${dampeningDrainPercent - 100}% more than usual.`;
        case 'persistent':
            return `The system hit takes ${persistentDamagePerTick} damage every few seconds for a while.`;
        case 'disabling':
            return 'The crew system hit can\'t play cards for a while.';
        case 'penetrating':
            return `The target's shields absorb only ${penetratingAbsorptionPercent}% of their usual share of the damage.`;
        case 'disrupting':
            return 'Puts a Disrupted card in the hand of the crew system hit. It can only be got rid of by playing it, which damages that system.';
        case 'destabilizing':
            return 'Adds an unstable effect to cards in the target system\'s hand.';

        // Deflector effects
        case 'Phased':
            return 'When slotted into the deflector, its effect bypasses shields and other barriers.';
        case 'Coherent':
            return 'When slotted into the deflector, its effect is amplified.';
        case 'Inverted':
            return 'When slotted into the deflector, its effect is reversed.';
        case 'Antiproton':
            return 'When slotted into the deflector, its effect deals damage to affected objects.';
        case 'Tetryon':
            return 'When slotted into the deflector, its effect drains shields from affected ships.';
        case 'Chroniton':
            return 'When slotted into the deflector, its effect slows actions of affected ships.';
        case 'Polaron':
            return 'When slotted into the deflector, its effect drains power from the systems of affected ships.';
        case 'Beam':
            return 'When slotted into the deflector, fires a beam directly at a target when activated.';
        case 'Pulse':
            return 'When slotted into the deflector, emits a pulse in all directions when activated.';
        case 'Burst':
            return 'When slotted into the deflector, emits a slower-moving effect towards a target when activated.';

        default:
            throw new Error(`Card trait not found: ${trait satisfies never}`);
    }
};

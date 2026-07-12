import { CardTrait, WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { Ship } from 'src/state/Ship';
import { SystemState } from 'src/state/systems/SystemState';

const traitBehaviors: Record<WeaponTrait, (ship: Ship, targetSystem: SystemState) => void> = {
    area: (_ship, _targetSystem) => {
        // TODO: implement this: damage nearby targets
    },
    cumbersome: (_ship, _targetSystem) => {
        // TODO: implement this: needs to hold aim for 2 seconds
    },
    draining: (_ship, _targetSystem) => {
        // TODO: implement this: adds a power draining effect on target system
    },
    dampening: (_ship, _targetSystem) => {
        // TODO: implement this: extra reduction to shield power
    },
    persistent: (_ship, _targetSystem) => {
        // TODO: implement this: adds a damage over time effect to target system
    },
    disabling: (_ship, _targetSystem) => {
        // TODO: implement this: adds an effect that prevents the target system from playing cards
    },
    penetrating: (_ship, _targetSystem) => {
        // TODO: implement this: partly bypasses shields
    },
    disrupting: (_ship, _targetSystem) => {
        // TODO: implement this: Adds a disrupted card to target system hand. Card deals damage when played.
        // targetSystem.adjustEffectLevel('disruptGeneration', 1);
    },
};

export function isWeaponTrait(trait: CardTrait): trait is WeaponTrait {
    return trait in traitBehaviors;
}

export function applyWeaponTrait(trait: WeaponTrait, ship: Ship, targetSystem: SystemState) {
    traitBehaviors[trait](ship, targetSystem);
}

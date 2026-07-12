import { CardTrait, WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { Ship } from 'src/state/Ship';
import { SystemState } from 'src/state/systems/SystemState';

const traitBehaviors: Record<WeaponTrait, (ship: Ship, targetSystem: SystemState) => void> = {
    area: (_ship, _targetSystem) => {
        // TODO: implement this
    },
    cumbersome: (_ship, _targetSystem) => {
        // TODO: implement this
    },
    draining: (_ship, _targetSystem) => {
        // TODO: implement this
    },
    dampening: (_ship, _targetSystem) => {
        // TODO: implement this
    },
    persistent: (_ship, _targetSystem) => {
        // TODO: implement this
    },
    disabling: (_ship, _targetSystem) => {
        // TODO: implement this
    },
    penetrating: (_ship, _targetSystem) => {
        // TODO: implement this
    },
    disrupting: (_ship, targetSystem) => {
        targetSystem.adjustEffectLevel('disruptGeneration', 1);
    },
};

export function isWeaponTrait(trait: CardTrait): trait is WeaponTrait {
    return trait in traitBehaviors;
}

export function applyWeaponTrait(trait: WeaponTrait, ship: Ship, targetSystem: SystemState) {
    traitBehaviors[trait](ship, targetSystem);
}

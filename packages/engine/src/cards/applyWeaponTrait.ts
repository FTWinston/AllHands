import { CardTrait, WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from 'src/state/systems/CrewSystemState';
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
    destabilizing: (_ship, targetSystem) => {
        if (!(targetSystem instanceof CrewSystemState)) {
            return; // Only crew system states have cards, so only they can be destabilized.
        }

        // Apply unstable trait to every card in hand that lacks it,
        // and one card from the deck for every hand card that already has it.
        let numFromDeck = 0;

        for (const card of targetSystem.hand) {
            if (card.hasTrait('unstable')) {
                numFromDeck++;
            } else {
                card.addTrait('unstable', true);
            }
        }

        for (const card of targetSystem.deck) {
            if (numFromDeck <= 0) {
                break;
            }

            if (!card.hasTrait('unstable')) {
                card.addTrait('unstable', true);
                numFromDeck--;
            }
        }
    },
};

export function isWeaponTrait(trait: CardTrait): trait is WeaponTrait {
    return trait in traitBehaviors;
}

export function applyWeaponTrait(trait: WeaponTrait, ship: Ship, targetSystem: SystemState) {
    traitBehaviors[trait](ship, targetSystem);
}

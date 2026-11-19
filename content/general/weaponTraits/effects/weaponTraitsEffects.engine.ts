import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects } from './weaponTraitsEffects.shared';
import type { CardState } from 'engine/state/CardState';
import type { EngineerSystemTile } from 'engine/state/systems/engineer/EngineerSystemTile';

export const effects = defineEngineEffects(sharedEffects, {
    persistentDamage: {
        apply: () => true,
        remove: () => { },
        // Damages the system by the effect's level each time it ticks, as any other damage to it would.
        tick: (system, level) => {
            system.systemState.applyDamage.invoke(level);
        },
    },
    powerDrain: {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(-level);
            return true;
        },
        remove: (system, _removal, level) => {
            system.adjustSystemPowerLevel(level);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(oldLevel - newLevel);
        },
    },
    systemDisabled: {
        // Only crew systems' cards are played by choice, so only they can be disabled.
        // Every card in the hand, and every card added to it while this lasts, is unplayable until it ends.
        apply: (system) => {
            if (!(crewRoleNames as readonly string[]).includes(system.system)) {
                return false;
            }

            const disabled = new Set<CardState>();
            disabledCards.set(system, disabled);

            const disable = (card: CardState) => {
                if (!card.hasTrait('unplayable')) {
                    card.addTrait('unplayable', ExtraTraitType.Negative);
                    disabled.add(card);
                }
            };

            for (const card of system.systemState.hand) {
                disable(card);
            }

            system.systemState.cardAddedToHand.addListener('systemDisabled', disable);
            return true;
        },
        // Wherever the cards it made unplayable have gone, they can be played again.
        remove: (system) => {
            system.systemState.cardAddedToHand.removeListener('systemDisabled');

            for (const card of disabledCards.get(system) ?? []) {
                card.removeTrait('unplayable');
            }

            disabledCards.delete(system);
        },
    },
});

/** The cards that each disabled system's System Disabled effect made unplayable. */
const disabledCards = new WeakMap<EngineerSystemTile, Set<CardState>>();

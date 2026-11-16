import { CardTrait, WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { areaDamagePercent, areaRadius, drainingPowerLoss, persistentDamagePerTick } from 'common-data/features/cards/utils/weaponTraitStats';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { weaponTraitTunings } from 'common-data/features/ships/utils/shieldStats';
import { LeveledSystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Damage } from 'common-data/features/space/types/Damage';
import { CrewSystemState } from 'src/state/systems/CrewSystemState';
import { SystemState } from 'src/state/systems/SystemState';

/** The card a hit from a disrupting weapon puts in the hand of each crew system. */
const disruptedCardTypes: Record<CrewRoleName, CardType> = {
    helm: 'disruptedHelm',
    science: 'disruptedScience',
    tactical: 'disruptedTactical',
    engineer: 'disruptedEngineer',
};

/** Put an effect on the system at the given level, or start its time over if it's already there, at the level it has. */
function addOrRenewEffect(targetSystem: SystemState, effect: LeveledSystemEffectType, level: number) {
    const tile = targetSystem.getShip().engineerState.systems.find(candidate => candidate.system === targetSystem.system);
    tile?.addEffect(effect, level);
}

/**
 * What each weapon trait does once a shot with it has hit a ship, and the hit has been applied: given the system it landed on, and the damage it did.
 * Effects that a trait leaves on that system are defined in content/general/weaponTraits.
 */
const traitBehaviors: Record<WeaponTrait, (targetSystem: SystemState, damage: Damage) => void> = {
    // These do nothing themselves, but shields can be tuned against them (see HullState).
    energyWeapon: () => { },
    torpedoWeapon: () => { },
    // These change how the shields take the hit, so they're worked out there (see resolveShieldHit).
    penetrating: () => { },
    dampening: () => { },
    area: (targetSystem, damage) => {
        // Every other ship close to the one hit takes a share of the damage, landing on a random system, apart from the ship that fired.
        // That's plain damage, though shields tuned against the weapon still reduce it.
        const amount = Math.round(damage.amount * areaDamagePercent / 100);
        if (amount <= 0) {
            return;
        }

        const gameState = targetSystem.getGameState();
        const traits = damage.traits.filter(trait => weaponTraitTunings[trait] !== undefined);

        for (const other of targetSystem.getShip().shipsWithin(areaRadius)) {
            if (other.id === damage.sourceId) {
                continue;
            }

            const passedThrough = other.damage({ amount, traits, sourceId: damage.sourceId });

            if (damage.sourceId) {
                gameState.broadcastWeaponEffect({
                    type: 'impact',
                    sourceId: damage.sourceId,
                    targetId: other.id,
                    damage: passedThrough,
                    startTime: gameState.currentTime,
                });
            }
        }
    },
    // This changes when the weapon can fire, not what a hit does: it's checked as the weapon is fired (see `TacticalState.getAimedFor`).
    cumbersome: () => { },
    draining: (targetSystem) => {
        addOrRenewEffect(targetSystem, 'powerDrain', drainingPowerLoss);
    },
    persistent: (targetSystem) => {
        addOrRenewEffect(targetSystem, 'persistentDamage', persistentDamagePerTick);
    },
    disabling: (targetSystem) => {
        // Only crew systems can be disabled: the effect refuses any other.
        targetSystem.getShip().engineerState.systems
            .find(candidate => candidate.system === targetSystem.system)
            ?.addEffect('systemDisabled');
    },
    disrupting: (targetSystem) => {
        if (!(targetSystem instanceof CrewSystemState)) {
            return; // Only crew system states have hands to disrupt.
        }

        // Room is made for it in a full hand, by discarding another card.
        targetSystem.addCard(disruptedCardTypes[targetSystem.system as CrewRoleName], true);
    },
    destabilizing: (targetSystem) => {
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
                card.addTrait('unstable', ExtraTraitType.RemoveOnPlay);
            }
        }

        for (const card of targetSystem.deck) {
            if (numFromDeck <= 0) {
                break;
            }

            if (!card.hasTrait('unstable')) {
                card.addTrait('unstable', ExtraTraitType.RemoveOnPlay);
                numFromDeck--;
            }
        }
    },
};

export function isWeaponTrait(trait: CardTrait): trait is WeaponTrait {
    return trait in traitBehaviors;
}

/** Do what a weapon trait does to a ship that a shot with it has hit, given the system the shot landed on and the damage it did. */
export function applyWeaponTrait(trait: WeaponTrait, targetSystem: SystemState, damage: Damage) {
    traitBehaviors[trait](targetSystem, damage);
}

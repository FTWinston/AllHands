import { IMap } from '@colyseus/react';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';

function applyModifiers(parameters: CardParameters, modifiers: IMap<string, number>) {
    for (const [key, value] of modifiers) {
        (parameters as Record<string, number>)[key] = (parameters[key] ?? 0) + value;
    }
}

export function resolveParameters(
    parameters: CardParameters,
    modifiers?: IMap<string, number> | null,
    additionalModifiers?: IMap<string, number> | null
): CardParameters {
    if (modifiers && modifiers.size > 0) {
        parameters = { ...parameters };

        applyModifiers(parameters, modifiers);
    }

    if (additionalModifiers && additionalModifiers.size > 0) {
        // Only create a copy of the parameters if we haven't already just done so.
        if (!modifiers || modifiers.size === 0) {
            parameters = { ...parameters };
        }

        applyModifiers(parameters, additionalModifiers);
    }

    // However far a card's cost is brought down, it never pays power back. The client does the same (see common-ui's resolveParameters).
    if (parameters.cost < 0) {
        parameters = { ...parameters, cost: 0 };
    }

    return parameters;
}

export function resolveParameter(parameter: string, parameters?: CardParameters, modifiers?: IMap<string, number>): number {
    const parameterValue = parameters?.[parameter] ?? 0;
    const modifierValue = modifiers?.get(parameter) ?? 0;
    const value = parameterValue + modifierValue;

    return parameter === 'cost' ? Math.max(0, value) : value;
}

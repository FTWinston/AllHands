import { MinimalReadonlyMap } from 'src/types/MinimalArray';
import { CardParameters } from '../types/CardParameters';

function applyModifiers(parameters: CardParameters, modifiers: MinimalReadonlyMap<string, number>) {
    for (const [key, value] of modifiers) {
        const current = parameters[key];
        if (typeof current === 'string') continue;
        (parameters as Record<string, number>)[key] = (current ?? 0) + value;
    }
}

export function resolveParameters(
    parameters: CardParameters,
    modifiers?: MinimalReadonlyMap<string, number> | null,
    additionalModifiers?: MinimalReadonlyMap<string, number> | null
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

    return parameters;
}

export function resolveParameter(parameter: string, parameters?: CardParameters, modifiers?: MinimalReadonlyMap<string, number>): number {
    const parameterValue = parameters?.[parameter] ?? 0;
    if (typeof parameterValue === 'string') return 0;
    const modifierValue = modifiers?.get(parameter) ?? 0;

    return parameterValue + modifierValue;
}

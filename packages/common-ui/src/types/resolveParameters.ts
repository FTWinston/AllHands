import { CardParametersBase } from 'common-data/features/cards/types/CardParameters';

function applyModifiers(parameters: CardParametersBase, modifiers: Record<string, number>) {
    for (const [key, value] of Object.entries(modifiers)) {
        (parameters as Record<string, number>)[key] = (parameters[key] ?? 0) + value;
    }
}

export function resolveParameters(
    parameters: CardParametersBase,
    modifiers?: Record<string, number> | null,
    additionalModifiers?: Record<string, number> | null
): CardParametersBase {
    if (modifiers && Object.keys(modifiers).length > 0) {
        parameters = { ...parameters };

        applyModifiers(parameters, modifiers);
    }

    if (additionalModifiers && Object.keys(additionalModifiers).length > 0) {
        // Only create a copy of the parameters if we haven't already just done so.
        if (!modifiers || Object.keys(modifiers).length === 0) {
            parameters = { ...parameters };
        }

        applyModifiers(parameters, additionalModifiers);
    }

    return parameters;
}

export function resolveParameter(parameter: string, parameters?: CardParametersBase, modifiers?: Record<string, number>): number {
    const parameterValue = parameters?.[parameter] ?? 0;
    const modifierValue = modifiers?.[parameter] ?? 0;

    return parameterValue + modifierValue;
}

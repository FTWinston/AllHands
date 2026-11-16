import { CardParametersBase } from 'common-data/features/cards/types/CardParameters';

function applyModifiers(parameters: CardParametersBase, modifiers: Partial<Record<string, number>>) {
    for (const [key, value] of Object.entries(modifiers)) {
        if (value !== undefined) {
            (parameters as Partial<Record<string, number>>)[key] = (parameters[key] ?? 0) + value;
        }
    }
}

export function resolveParameters(
    parameters: CardParametersBase,
    modifiers?: Partial<Record<string, number>> | null,
    additionalModifiers?: Partial<Record<string, number>> | null
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

    // However far a card's cost is brought down, it never pays power back, as on the server (see the engine's resolveParameters).
    if ((parameters.cost ?? 0) < 0) {
        parameters = { ...parameters, cost: 0 };
    }

    return parameters;
}

export function resolveParameter(parameter: string, parameters?: CardParametersBase, modifiers?: Partial<Record<string, number>> | null, additionalModifiers?: Partial<Record<string, number>> | null): number {
    const parameterValue = parameters?.[parameter] ?? 0;
    const modifierValue = modifiers?.[parameter] ?? 0;
    const additionalModifierValue = additionalModifiers?.[parameter] ?? 0;
    const value = parameterValue + modifierValue + additionalModifierValue;

    return parameter === 'cost' ? Math.max(0, value) : value;
}

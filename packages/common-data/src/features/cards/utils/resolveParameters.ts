import { CardParameters } from '../types/CardParameters';
import { MinimalReadonlyMap } from 'src/types/MinimalArray';

export function resolveParameters(parameters: CardParameters, modifiers?: MinimalReadonlyMap<string, number>): CardParameters {
    if (modifiers && modifiers.size > 0) {
        const result: Record<string, number> = { ...parameters };

        for (const [key, value] of modifiers) {
            result[key] = (result[key] ?? 0) + value;
        }

        return result as CardParameters;
    }

    return parameters;
}

export function resolveParameter(parameter: string, parameters?: CardParameters, modifiers?: MinimalReadonlyMap<string, number>): number {
    const parameterValue = parameters?.[parameter] ?? 0;
    const modifierValue = modifiers?.get(parameter) ?? 0;

    return parameterValue + modifierValue;
}

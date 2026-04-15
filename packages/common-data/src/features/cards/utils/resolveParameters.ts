import { CardParameters } from '../types/CardParameters';

export function resolveParameters(parameters?: CardParameters, modifiers?: CardParameters): CardParameters {
    if (modifiers && modifiers.size > 0) {
        const result = new Map<string, number>(parameters);

        for (const [key, value] of modifiers) {
            result.set(key, (result.get(key) ?? 0) + value);
        }

        return result;
    }

    return parameters ?? new Map<string, number>();
}

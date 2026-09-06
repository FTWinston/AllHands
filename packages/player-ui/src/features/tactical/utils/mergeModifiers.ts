export function mergeModifiers(
    cardModifiers: Partial<Record<string, number>> | undefined,
    slotModifiers: Partial<Record<string, number>> | undefined
): Record<string, number> {
    const mergedModifiers: Record<string, number> = {};

    if (cardModifiers) {
        for (const [key, value] of Object.entries(cardModifiers)) {
            mergedModifiers[key] = (mergedModifiers[key] ?? 0) + (value ?? 0);
        }
    }

    if (slotModifiers) {
        for (const [key, value] of Object.entries(slotModifiers)) {
            mergedModifiers[key] = (mergedModifiers[key] ?? 0) + (value ?? 0);
        }
    }

    return mergedModifiers;
}

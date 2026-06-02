export function mergeModifiers(
    cardModifiers: Record<string, number> | undefined,
    slotModifiers: Record<string, number> | undefined
): Record<string, number> {
    const mergedModifiers: Record<string, number> = {};

    if (cardModifiers) {
        for (const [key, value] of Object.entries(cardModifiers)) {
            mergedModifiers[key] = (mergedModifiers[key] ?? 0) + (value as number);
        }
    }

    if (slotModifiers) {
        for (const [key, value] of Object.entries(slotModifiers)) {
            mergedModifiers[key] = (mergedModifiers[key] ?? 0) + (value as number);
        }
    }

    return mergedModifiers;
}

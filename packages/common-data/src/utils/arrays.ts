export const getArrayValue = <T>(array: T[], indexToClamp: number): T => {
    const clampedIndex = Math.max(0, Math.min(indexToClamp, array.length - 1));
    return array[clampedIndex];
};

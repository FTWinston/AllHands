/** The NATO phonetic alphabet: short, distinct when shouted over a noisy bridge, and already known to most people. */
const phoneticAlphabet = [
    'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike',
    'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'Xray', 'Yankee', 'Zulu',
] as const;

/** The label for the contact at the given position in the order a crew finds them: "Alpha" first, then "Bravo", on to "Zulu", then "Alpha 2" and so on. */
export function getContactLabel(index: number): string {
    const word = phoneticAlphabet[index % phoneticAlphabet.length];
    const round = Math.floor(index / phoneticAlphabet.length);
    return round === 0 ? word : `${word} ${round + 1}`;
}

/** Something said over comms during an encounter, which the viewscreen shows for a while. Nobody has to answer it. */
export interface HailInfo {
    /** Who's speaking. */
    speaker: string;
    text: string;
}

/** How long any hail stays on the viewscreen, in milliseconds, before the time it takes to read. */
const hailBaseDuration = 2500;
/** How much longer a hail stays for each character of its text, in milliseconds. */
const hailDurationPerCharacter = 55;

/** How long a hail with the given text stays on the viewscreen, in milliseconds: long enough to read it at an easy pace. */
export function getHailDuration(text: string): number {
    return hailBaseDuration + text.length * hailDurationPerCharacter;
}

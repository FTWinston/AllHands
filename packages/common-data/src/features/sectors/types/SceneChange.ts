/**
 * Why every screen is fading to black before the scene changes: the game starting, or travelling between the map and an encounter.
 * Crew screens keep their header visible when travelling, as it's the same on both sides.
 */
export type SceneChange = 'start' | 'travel';

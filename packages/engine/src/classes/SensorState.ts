import { Schema } from '@colyseus/schema';

export class SensorState extends Schema {
    // Power level
    // Damage level

    // Cards in play?
    // Cards in hand
    // Draw pile, discard pile. (Never shown to the client, so e.g. View() can be used on those properties, and NOT add this to players' view state.)
}

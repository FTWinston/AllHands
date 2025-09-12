import { Schema } from '@colyseus/schema';

export class EngineerState extends Schema {
    // Power level of every system
    // Damage level of every system
    // Positions and status effects of every system.

    // Cards in hand
    // Draw pile, discard pile. (Never shown to the client, so e.g. View() can be used on those properties, and NOT add this to players' view state.)
}

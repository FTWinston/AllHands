import { Room, Client } from "colyseus";
import { Schema, type } from "@colyseus/schema";

export class MyRoomState extends Schema {
  @type("string") mySynchronizedProperty: string = "Hello world";
}

export class MyRoom extends Room<MyRoomState> {
  maxClients = 5;

  onCreate () {
    this.setState(new MyRoomState());

    this.onMessage("message", (client, message) => {
        console.log(`Message from ${client.sessionId}:`, message);

        this.broadcast('messages', `(${client.sessionId}) ${message}`);
    });
  }

  onJoin (client: Client) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}

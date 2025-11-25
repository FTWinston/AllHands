import { Room } from 'colyseus.js';
import { ITimeProvider } from 'src/types/ITimeProvider';

type PongMessage = {
    clientSendTime: number;
    serverTime: number;
};

/**
 * Provide access to a predicted server clock, from on the client, in a Colyseus multiplayer environment.
 */
export class TimeSynchronizer implements ITimeProvider {
    private room: Room;

    /** The current offset, which is the main output. */
    private offset: number = 0;

    /** The "actual" offset, which we lerp towards. */
    private targetOffset: number = 0;

    private pingTimerId: number | null = null;
    private smoothingTimerId: number | null = null;
    private pingHistory: number[] = [];

    constructor(room: Room) {
        this.room = room;

        // Listen for pongs, which are the server's response to the pings this class sends.
        this.room.onMessage<PongMessage>('pong', (message) => {
            this.processPong(message);
        });
    }

    public async start() {
        // To start with, do 5 pings in quick succession, so we can take an average.
        for (let i = 0; i < 5; i++) {
            this.sendPing();
            await new Promise(r => setTimeout(r, 100)); // Tiny delay prevents packet merging
        }

        // Start ping timer, adapting to changes in latency every 30 seconds.
        this.pingTimerId = setInterval(() => this.sendPing(), 3000) as unknown as number;

        // Start offset change smoothing timer, updating 10 times per second.
        this.smoothingTimerId = setInterval(() => this.updateOffset(), 100) as unknown as number;
    }

    private updateOffset() {
        // Smoothly drift the actual offset towards the calculated target
        const diff = this.targetOffset - this.offset;

        // If the drift is massive (startup), snap to it
        if (Math.abs(diff) > 500) {
            this.offset = this.targetOffset;
        } else {
            // Lerp for smoothness: one percent of the difference at a time.
            this.offset += diff * 0.01;
        }
    }

    /**
     * Stops the background sync. Call this when leaving the room.
     */
    public stop() {
        if (this.pingTimerId) {
            clearInterval(this.pingTimerId);
            this.pingTimerId = null;
        }

        if (this.smoothingTimerId) {
            clearInterval(this.smoothingTimerId);
            this.smoothingTimerId = null;
        }
    }

    public getServerTime(): number {
        return Date.now() + this.offset;
    }

    private sendPing() {
        // Send the current client time so we can calculate exact RTT later
        this.room.send('ping', { clientSendTime: Date.now() });
    }

    private processPong(message: PongMessage) {
        const now = Date.now();
        const sentTime = message.clientSendTime;
        const serverTime = message.serverTime;

        // 1. Calculate Round Trip Time (RTT)
        const rtt = now - sentTime;

        // 2. One-way latency (Symmetric assumption)
        const latency = rtt / 2;

        // 3. Calculate Offset
        // If ServerTime is 1000, and it took 10ms (5ms one way) to get here:
        // The server was at 1000 when my clock was at (now - 5ms).
        // Offset = ServerTime - (ClientTime - Latency)
        // Simplifies to:
        const rawOffset = serverTime - sentTime - latency;

        // 4. Add to history, removing the oldest record if we have more than 5.
        this.pingHistory.push(rawOffset);
        if (this.pingHistory.length > 5) {
            this.pingHistory.shift();
        }

        // 5. Calculate Target
        this.targetOffset = this.calculateAverageOffset();
    }

    private calculateAverageOffset(): number {
        if (this.pingHistory.length === 0) {
            return 0;
        }

        const sum = this.pingHistory.reduce((a, b) => a + b, 0);
        const mean = sum / this.pingHistory.length;

        return mean;
    }
}

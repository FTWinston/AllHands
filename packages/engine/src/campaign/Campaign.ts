import { createEncounter, getDefaultNode, hasEncounter } from '../encounters/EncounterRegistry';
import { EncounterSummaryState } from '../state/EncounterSummaryState';
import { MotionKeyframe } from '../state/MotionKeyframe';
import { ObjectiveState } from '../state/ObjectiveState';
import { PlayerShip } from '../state/PlayerShip';
import { SectorMapState } from '../state/SectorMapState';
import { SectorMessageState } from '../state/SectorMessageState';
import { Ship } from '../state/Ship';
import { createRouteHand, createWarpAwayCard } from './campaignCards';
import { getPlayerShips } from './playerShips';
import { playerShipSetup } from './playerShipSetup';
import { generateSector } from './SectorGenerator';
import { sectorThemes, type SectorTheme } from './sectorThemes';
import type { Encounter } from '../encounters/Encounter';
import type { CardState } from '../state/CardState';
import type { GameObject } from '../state/GameObject';
import type { GameState } from '../state/GameState';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { EncounterId, SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';

/**
 * Drives the game flow: sector intro -> map -> encounter -> (warp away) -> map ... -> boss -> sector outro -> next sector,
 * ending in victory after the last outro or defeat when every player ship is lost.
 * Methods that act on a player request return whether it was accepted; callers are responsible for checking the sender's role.
 */
export class Campaign {
    private sectorIndex = -1;
    private sector: SectorInfo | null = null;
    private encounter: Encounter | null = null;
    private isDevEncounter = false;
    private warpOffered = false;
    private readonly warpCards = new Map<Ship, CardState>();
    private tearingDown = false;

    constructor(
        private readonly state: GameState,
        private readonly themes: readonly SectorTheme[] = sectorThemes
    ) {}

    get activeEncounter(): Encounter | null {
        return this.encounter;
    }

    /** Begins the first sector. Does nothing once started. */
    start(): void {
        if (this.state.phase !== 'setup') {
            return;
        }

        this.enterSector(0);
    }

    tick(deltaTime: number): void {
        if (this.state.phase !== 'encounter' || !this.encounter) {
            return;
        }

        this.encounter.tick(deltaTime);
        this.checkObjective();
    }

    onObjectRemoved(object: GameObject): void {
        if (this.tearingDown || this.state.phase === 'setup' || this.state.phase === 'ended') {
            return;
        }

        if (object instanceof PlayerShip) {
            if (getPlayerShips(this.state).length === 0) {
                this.finish('defeat');
            }

            return;
        }

        if (this.state.phase === 'encounter' && this.encounter) {
            this.encounter.onObjectRemoved(object);
            this.checkObjective();
        }
    }

    /** Tactical acknowledges the sector intro or outro message. */
    dismissMessage(): boolean {
        const { phase } = this.state;
        if (phase !== 'sectorIntro' && phase !== 'sectorOutro') {
            return false;
        }

        this.state.message = null;

        if (phase === 'sectorIntro') {
            this.showMap();
        } else if (this.sectorIndex + 1 < this.themes.length) {
            this.enterSector(this.sectorIndex + 1);
        } else {
            this.finish('victory');
        }

        return true;
    }

    /** Helm picks the next node (by playing a route card); the first valid selection is final for every crew. */
    selectRoute(ship: Ship, nodeId: string): boolean {
        const map = this.state.map;
        if (this.state.phase !== 'map' || !map || !this.sector || !this.isPlayerShip(ship)) {
            return false;
        }

        if (!map.availableNodeIds.includes(nodeId)) {
            return false;
        }

        const node = this.sector.nodes.find(candidate => candidate.id === nodeId);
        if (!node) {
            return false;
        }

        map.moveTo(nodeId);
        this.startEncounter(node, false);
        return true;
    }

    /** Helm plays the Warp Away card, ending the completed encounter. */
    warpAway(ship: Ship): boolean {
        const card = this.warpCards.get(ship);
        if (this.state.phase !== 'encounter' || !this.warpOffered || !card || !ship.helmState.hand.includes(card)) {
            return false;
        }

        const node = this.encounter!.node;
        this.teardownEncounter();

        if (!this.isDevEncounter && node.id === this.state.map?.bossNodeId) {
            this.enterOutro();
        } else {
            this.showMap();
        }

        return true;
    }

    /** Dev tools: abandon whatever is running and start the given encounter standalone with repaired ships. */
    devLoadEncounter(encounterId: EncounterId): boolean {
        const { phase } = this.state;
        if (phase === 'setup' || phase === 'ended' || !hasEncounter(encounterId)) {
            return false;
        }

        const ships = getPlayerShips(this.state);
        for (const ship of ships) {
            ship.helmState.restoreRealHand();
            ship.scienceState.restoreRealHand();
        }

        this.teardownEncounter();

        for (const ship of ships) {
            ship.fullyRepair();
        }

        this.state.message = null;
        this.startEncounter(getDefaultNode(encounterId), true);
        return true;
    }

    private enterSector(index: number): void {
        const theme = this.themes[index];
        this.sectorIndex = index;
        this.sector = generateSector(this.state.random, theme);

        this.state.map = new SectorMapState(this.sector, index, this.themes.length);
        this.state.message = new SectorMessageState({ kind: 'intro', title: this.sector.name, text: this.sector.introMessage });
        this.state.encounter = null;
        this.setPhase('sectorIntro');
    }

    private enterOutro(): void {
        const sector = this.sector!;
        this.state.message = new SectorMessageState({ kind: 'outro', title: sector.name, text: sector.outroMessage });
        this.setPhase('sectorOutro');
    }

    private finish(outcome: GameOutcome): void {
        this.encounter?.dispose();
        this.encounter = null;
        this.state.encounter = null;
        this.state.message = null;
        this.state.outcome = outcome;
        this.state.gameStatus = 'ended';
        this.state.phase = 'ended';
    }

    /** The map shows each helm and science a route card per available node; their real hands are set aside untouched. */
    private showMap(): void {
        const map = this.state.map!;
        const nodes = this.sector!.nodes.filter(node => map.availableNodeIds.includes(node.id));

        for (const ship of getPlayerShips(this.state)) {
            ship.helmState.showFakeHand(createRouteHand(ship, nodes, 'basic'));
            ship.scienceState.showFakeHand(createRouteHand(ship, nodes, 'full'));
        }

        this.setPhase('map');
    }

    private startEncounter(node: SectorNodeInfo, isDev: boolean): void {
        const ships = getPlayerShips(this.state);
        for (const ship of ships) {
            ship.helmState.restoreRealHand();
            ship.scienceState.restoreRealHand();
            ship.setMotion(new MotionKeyframe(
                this.state.currentTime,
                playerShipSetup.position.x,
                playerShipSetup.position.y,
                playerShipSetup.position.angle
            ));
        }

        this.isDevEncounter = isDev;
        this.warpOffered = false;
        this.encounter = createEncounter(this.state, node);
        this.setPhase('encounter');

        const { node: encounterNode } = this.encounter;
        const summary = new EncounterSummaryState(encounterNode.encounterId, encounterNode.name);
        summary.environment = encounterNode.environment;
        summary.factionId = encounterNode.factionId;
        summary.objective = encounterNode.objective ? new ObjectiveState(encounterNode.objective) : undefined;
        this.state.encounter = summary;

        this.encounter.start();
        summary.objectiveEndTime = this.encounter.objectiveEndTime;
        this.checkObjective();
    }

    /** Once the objective is met, every helm gets an expendable Warp Away card in its real hand. */
    private checkObjective(): void {
        if (this.warpOffered || !this.encounter?.isComplete) {
            return;
        }

        this.warpOffered = true;
        if (this.state.encounter) {
            this.state.encounter.objectiveMet = true;
        }

        for (const ship of getPlayerShips(this.state)) {
            const card = createWarpAwayCard(ship);
            ship.helmState.addExtraCard(card);
            this.warpCards.set(ship, card);
        }
    }

    /** Ends the running encounter: removes the warp cards and every non-player object, and resets the player ships' card state. */
    private teardownEncounter(): void {
        for (const [ship, card] of this.warpCards) {
            ship.helmState.removeCard(card.id);
        }

        this.warpCards.clear();
        this.warpOffered = false;

        this.encounter?.dispose();
        this.encounter = null;
        this.state.encounter = null;

        this.tearingDown = true;
        try {
            for (const object of [...this.state.objects.values()]) {
                if (!(object instanceof PlayerShip)) {
                    if (object instanceof Ship) {
                        object.scienceState.unsubscribeFromShip();
                    }

                    this.state.remove(object);
                }
            }
        } finally {
            this.tearingDown = false;
        }

        for (const ship of getPlayerShips(this.state)) {
            ship.cleanupAfterEncounter();
        }
    }

    private setPhase(phase: GamePhase): void {
        this.state.phase = phase;
        // Draws stay frozen everywhere except in an encounter, so nothing is gained or lost while choosing a route.
        this.state.cardGenerationPaused = phase !== 'encounter';
    }

    private isPlayerShip(ship: Ship): boolean {
        return this.state.objects.get(ship.id) === ship;
    }
}

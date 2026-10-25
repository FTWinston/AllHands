import { getAntimatterReward } from 'common-data/features/ships/utils/antimatter';
import { getPlayerShips } from 'src/utils/shipQueries';
import { createEncounter, getDefaultNode, hasEncounter } from '../encounters/EncounterRegistry';
import { CardState } from '../state/CardState';
import { EncounterSummaryState } from '../state/EncounterSummaryState';
import { MotionKeyframe } from '../state/MotionKeyframe';
import { PlayerShip } from '../state/PlayerShip';
import { SectorMapState } from '../state/SectorMapState';
import { SectorMessageState } from '../state/SectorMessageState';
import { Ship } from '../state/Ship';
import { createRouteCards } from './campaignCards';
import { playerShipSetup } from './playerShipSetup';
import { generateSector } from './SectorGenerator';
import { sectorThemes, type SectorTheme } from './sectorThemes';
import type { Encounter } from '../encounters/Encounter';
import type { GameObject } from '../state/GameObject';
import type { GameState } from '../state/GameState';
import type { GameOutcome } from 'common-data/features/sectors/types/GamePhase';
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
    private playerShipsInEncounter = new Set<PlayerShip>();
    private tearingDown = false;

    constructor(
        private readonly state: GameState,
        private readonly themes: readonly SectorTheme[] = sectorThemes
    ) {}

    get activeEncounter(): Encounter | null {
        return this.encounter;
    }

    /** Ships only simulate their systems while this is true. */
    get isInEncounter(): boolean {
        return this.state.phase === 'encounter' && !this.isEnded;
    }

    private get isEnded(): boolean {
        return this.state.gameStatus === 'ended';
    }

    /** Begins the first sector. Does nothing once started. */
    start(): void {
        if (this.state.phase !== null) {
            return;
        }

        this.enterSector(0);

        // Ships are created before the campaign exists, so they started card generation timers that must stop until the first encounter.
        for (const ship of getPlayerShips(this.state)) {
            ship.updateCardGeneration();
        }
    }

    tick(deltaTime: number): void {
        if (!this.isInEncounter || !this.encounter) {
            return;
        }

        this.encounter.tick(deltaTime);
    }

    onObjectRemoved(object: GameObject): void {
        if (this.tearingDown || this.state.phase === null || this.isEnded) {
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
        }
    }

    /** Tactical acknowledges the sector intro or outro message. */
    dismissMessage(): boolean {
        const { phase } = this.state;
        if (this.isEnded || (phase !== 'sectorIntro' && phase !== 'sectorOutro')) {
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
    selectRoute(_ship: PlayerShip, nodeId: string): boolean {
        const map = this.state.map;
        if (this.state.phase !== 'map' || this.isEnded || !map || !this.sector) {
            return false;
        }

        if (!map.availableNodeIds.includes(nodeId)) {
            return false;
        }

        const node = this.sector.nodes.find(candidate => candidate.id === nodeId);
        if (!node) {
            return false;
        }

        return this.state.changeScene('travel', () => {
            if (!this.isEnded) {
                map.moveTo(nodeId);
                this.startEncounter(node);
            }
        });
    }

    /** Helm plays the Warp Away card, ending the completed encounter. */
    warpAway(ship: Ship): boolean {
        if (!this.isInEncounter || !this.state.encounter?.objectiveMet || !(ship instanceof PlayerShip) || !this.playerShipsInEncounter.has(ship)) {
            return false;
        }

        this.playerShipsInEncounter.delete(ship);

        if (this.playerShipsInEncounter.size === 0) {
            const node = this.encounter!.node;

            this.state.changeScene('travel', () => {
                if (this.isEnded) {
                    return;
                }

                this.teardownEncounter();

                if (!this.state.map || node.id === this.state.map.bossNodeId) {
                    this.enterOutro();
                } else {
                    this.showMap();
                }
            });
        }

        return true;
    }

    /** Dev tools: abandon whatever is running and start the given encounter standalone with repaired ships. */
    devLoadEncounter(encounterId: EncounterId): boolean {
        if (this.state.phase === null || this.isEnded || !hasEncounter(encounterId)) {
            return false;
        }

        this.teardownEncounter();

        for (const ship of getPlayerShips(this.state)) {
            ship.fullyRepair();
        }

        this.state.message = null;
        this.startEncounter(getDefaultNode(encounterId));
        return true;
    }

    private enterSector(index: number): void {
        const theme = this.themes[index];
        this.sectorIndex = index;
        this.sector = generateSector(this.state.random, theme, index);

        this.state.map = new SectorMapState(this.sector, index, this.themes.length);
        this.state.message = new SectorMessageState({ kind: 'intro', title: this.sector.name, text: this.sector.introMessage });
        this.state.encounter = null;
        this.state.phase = 'sectorIntro';
    }

    private enterOutro(): void {
        const sector = this.sector!;
        this.state.message = new SectorMessageState({ kind: 'outro', title: sector.name, text: sector.outroMessage });
        this.state.phase = 'sectorOutro';
    }

    private finish(outcome: GameOutcome): void {
        this.encounter = null;
        this.state.encounter = null;
        this.state.encounterKind = null;
        this.state.message = outcome === 'defeat' && this.sector
            ? new SectorMessageState({ kind: 'defeat', title: this.sector.name, text: this.sector.defeatMessage })
            : null;
        this.state.outcome = outcome;
        this.state.gameStatus = 'ended';
    }

    /**
     * The map gives each helm a route card per available node, and shows what those nodes hold on science's long range sensors.
     * Hands are already empty here (see `teardownEncounter`), and no cards are drawn until the next encounter because game time stops.
     */
    private showMap(): void {
        const map = this.state.map!;
        const nodes = this.sector!.nodes.filter(node => map.availableNodeIds.includes(node.id));

        for (const ship of getPlayerShips(this.state)) {
            ship.helmState.setNonEncounterCards(createRouteCards(ship, nodes));
            ship.scienceState.setDestinations(nodes);
        }

        this.state.phase = 'map';
    }

    private startEncounter(node: SectorNodeInfo): void {
        for (const ship of getPlayerShips(this.state)) {
            ship.helmState.setNonEncounterCards([]);
            ship.scienceState.setDestinations([]);
            ship.startEncounter();
            ship.setMotion(new MotionKeyframe(
                this.state.currentTime,
                playerShipSetup.position.x,
                playerShipSetup.position.y,
                playerShipSetup.position.angle
            ));

            this.playerShipsInEncounter.add(ship);
        }

        this.encounter = createEncounter(this.state, node);
        this.state.phase = 'encounter';

        const { node: encounterNode } = this.encounter;
        const summary = new EncounterSummaryState(encounterNode.encounterId, encounterNode.name);
        summary.environment = encounterNode.environment;
        summary.factionId = encounterNode.factionId;
        summary.objective = encounterNode.objective ? encounterNode.objective : undefined;
        this.state.encounter = summary;
        this.state.encounterKind = encounterNode.kind;

        // Subscribe before starting, as an encounter may complete immediately.
        this.encounter.onComplete.addListener('campaign', () => {
            this.awardAntimatter();
            this.offerWarpAway();
        });
        if (this.state.devAutoWin) {
            this.encounter.startComplete();
        } else {
            this.encounter.start();
        }
        summary.objectiveEndTime = this.encounter.objectiveEndTime;
    }

    /** Each player ship still in the completed encounter earns antimatter, according to the kind of node it was (see `antimatterRewards`). */
    private awardAntimatter(): void {
        const reward = this.encounter ? getAntimatterReward(this.encounter.node) : 0;

        for (const ship of this.playerShipsInEncounter) {
            ship.addAntimatter(reward);
        }
    }

    /** Once the objective is met, every helm gets an expendable Warp Away card in its hand. */
    private offerWarpAway(): void {
        if (!this.state.encounter || this.state.encounter.objectiveMet) {
            return;
        }

        this.state.encounter.objectiveMet = true;

        for (const ship of this.playerShipsInEncounter) {
            const card = new CardState(ship.getCardId(), 'warpAway');
            ship.helmState.addCardToHand(card);
        }
    }

    /** Ends the running encounter: removes the warp cards and every non-player object, and resets the player ships' card state. */
    private teardownEncounter(): void {
        this.playerShipsInEncounter.clear();
        this.encounter = null;
        this.state.encounter = null;
        this.state.encounterKind = null;

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
}

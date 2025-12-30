import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { AiShip } from '../state/AiShip';
import { SystemState } from '../state/SystemState';
import {
    EngineerAiController,
    HelmAiController,
    SensorsAiController,
    TacticalAiController,
} from './systems';
import {
    ActionPlan,
    AiConfig,
    defaultAiConfig,
    PlanStep,
    StrategicGoal,
    StrategicGoalType,
    SystemCapability,
    SystemReport,
    SystemWant,
} from './types';

/**
 * Central AI controller for an AI-controlled ship.
 * Coordinates between system AIs (crew members) to create and execute action plans.
 *
 * The command AI:
 * 1. Gathers reports (wants & capabilities) from all system AIs
 * 2. Creates or updates an action plan based on the current goal
 * 3. Resolves conflicts between system wants
 * 4. Assigns steps to systems and monitors execution
 * 5. Periodically reassesses the plan based on changing conditions
 */
export class ShipAiController {
    private readonly helmAi: HelmAiController;
    private readonly sensorsAi: SensorsAiController;
    private readonly tacticalAi: TacticalAiController;
    private readonly engineerAi: EngineerAiController;

    private readonly config: AiConfig;

    /** The current action plan being executed */
    private currentPlan: ActionPlan | null = null;

    /** Time accumulator for plan reassessment */
    private reassessmentTimer = 0;

    /** Base interval between plan reassessments (in ms) */
    private readonly baseReassessmentInterval = 2000;

    /** Time accumulator for step execution checks */
    private executionTimer = 0;

    /** How often to check for executable steps (in ms) */
    private readonly executionCheckInterval = 500;

    constructor(
        private readonly ship: AiShip,
        config?: Partial<AiConfig>
    ) {
        this.config = { ...defaultAiConfig, ...config };

        // Initialize system controllers
        this.helmAi = new HelmAiController();
        this.sensorsAi = new SensorsAiController();
        this.tacticalAi = new TacticalAiController();
        this.engineerAi = new EngineerAiController();
    }

    /**
     * Update the AI controller. Called each game tick.
     * @param deltaTime Time since last update in milliseconds
     * @param currentTime The current game time in milliseconds
     */
    public update(deltaTime: number, currentTime: number): void {
        // Check for step execution more frequently
        this.executionTimer += deltaTime;
        if (this.executionTimer >= this.executionCheckInterval) {
            this.executionTimer = 0;
            this.executeReadySteps(currentTime);
        }

        // Reassess the plan periodically
        this.reassessmentTimer += deltaTime;
        const reassessmentInterval = this.baseReassessmentInterval * this.config.reactionMultiplier;

        if (this.reassessmentTimer >= reassessmentInterval) {
            this.reassessmentTimer = 0;
            this.reassessPlan(currentTime);
        }
    }

    /**
     * Reassess and potentially update the current action plan.
     */
    private reassessPlan(currentTime: number): void {
        // Gather reports from all systems
        const reports = this.gatherSystemReports(currentTime);

        // Determine the strategic goal
        const goal = this.determineStrategicGoal(reports, currentTime);

        // Check if we need a new plan
        if (this.shouldCreateNewPlan(goal)) {
            this.currentPlan = this.createActionPlan(goal, reports, currentTime);
            console.log(`[AI] ${this.ship.id} created new plan: ${goal.type}`);
        } else if (this.currentPlan) {
            // Update the existing plan with new information
            this.updateActionPlan(this.currentPlan, reports, currentTime);
        }
    }

    /**
     * Gather reports from all system AIs.
     */
    private gatherSystemReports(currentTime: number): SystemReport[] {
        return [
            this.helmAi.generateReport(this.ship, this.ship.helmState, this.currentPlan, this.config, currentTime),
            this.sensorsAi.generateReport(this.ship, this.ship.sensorState, this.currentPlan, this.config, currentTime),
            this.tacticalAi.generateReport(this.ship, this.ship.tacticalState, this.currentPlan, this.config, currentTime),
            this.engineerAi.generateReport(this.ship, this.ship.engineerState, this.currentPlan, this.config, currentTime),
        ];
    }

    /**
     * Determine what strategic goal the ship should pursue.
     */
    private determineStrategicGoal(reports: SystemReport[], currentTime: number): StrategicGoal {
        // Check for critical concerns that override current goals
        const criticalConcerns = reports
            .flatMap(r => r.concerns)
            .filter(c => c.severity > 70);

        if (criticalConcerns.some(c => c.type === 'low-health')) {
            // Critical damage - switch to repair/flee
            const currentTarget = this.currentPlan?.goal.targetId;
            if (currentTarget) {
                return {
                    type: 'flee-target',
                    targetId: currentTarget,
                    priority: 90,
                    createdAt: currentTime,
                };
            }
            return {
                type: 'repair-critical',
                priority: 90,
                createdAt: currentTime,
            };
        }

        // Use personality to determine default behavior
        const goalType = this.getDefaultGoalForPersonality();

        // If we have a current plan that's still valid, keep it
        if (this.currentPlan && this.currentPlan.goal.type === goalType) {
            return this.currentPlan.goal;
        }

        return {
            type: goalType,
            priority: 50,
            createdAt: currentTime,
        };
    }

    /**
     * Get the default goal type based on personality.
     */
    private getDefaultGoalForPersonality(): StrategicGoalType {
        switch (this.config.personality) {
            case 'aggressive':
                return 'attack-target';
            case 'defensive':
                return 'defend-position';
            case 'patrol':
                return 'patrol-area';
            default:
                return 'idle';
        }
    }

    /**
     * Determine if we should create a new plan.
     */
    private shouldCreateNewPlan(goal: StrategicGoal): boolean {
        if (!this.currentPlan) return true;
        if (this.currentPlan.phase === 'completed' || this.currentPlan.phase === 'abandoned') return true;
        if (this.currentPlan.goal.type !== goal.type) return true;
        if (goal.priority > this.currentPlan.goal.priority + 20) return true; // Significant priority increase
        return false;
    }

    /**
     * Create a new action plan for a strategic goal.
     */
    private createActionPlan(goal: StrategicGoal, reports: SystemReport[], currentTime: number): ActionPlan {
        const steps: PlanStep[] = [];

        // Resolve wants from all systems to determine coordinated actions
        const allWants = reports.flatMap(r => r.wants);
        const allCapabilities = reports.flatMap(r => r.capabilities);

        // Build steps based on goal type
        switch (goal.type) {
            case 'attack-target':
                this.buildAttackSteps(steps, allWants, allCapabilities, goal, currentTime);
                break;
            case 'flee-target':
                this.buildFleeSteps(steps, allWants, allCapabilities, goal, currentTime);
                break;
            case 'patrol-area':
                this.buildPatrolSteps(steps, allWants, allCapabilities, goal, currentTime);
                break;
            case 'repair-critical':
                this.buildRepairSteps(steps, allWants, allCapabilities, goal, currentTime);
                break;
            case 'defend-position':
                this.buildDefendSteps(steps, allWants, allCapabilities, goal, currentTime);
                break;
            default:
                // Idle - no steps
                break;
        }

        return {
            goal,
            phase: steps.length > 0 ? 'preparing' : 'completed',
            steps,
            lastReassessedAt: currentTime,
        };
    }

    /**
     * Build attack sequence steps.
     */
    private buildAttackSteps(
        steps: PlanStep[],
        wants: SystemWant[],
        capabilities: SystemCapability[],
        goal: StrategicGoal,
        _currentTime: number
    ): void {
        // Resolve range conflict between tactical (wants close) and engineer (wants safe)
        const rangeWants = wants.filter(w => w.type === 'close-range' || w.type === 'long-range');
        const desiredRange = this.resolveRangeConflict(rangeWants);

        // Step 1: Approach or maintain distance
        const moveCapability = capabilities.find(c =>
            c.system === 'helm' && (c.action === 'approach-target' || c.action === 'retreat-from-target')
        );
        if (moveCapability) {
            steps.push({
                system: 'helm',
                action: desiredRange === 'close' ? 'approach-target' : 'hold-position',
                status: 'pending',
                readyAt: moveCapability.readyAt,
                cardId: moveCapability.cardId,
                target: moveCapability.target,
                reasoning: `Position for attack (${desiredRange} range)`,
            });
        }

        // Step 2: Evasive maneuvers if engineer wants to avoid damage
        const avoidDamageWant = wants.find(w => w.type === 'avoid-damage' && w.priority > 50);
        if (avoidDamageWant) {
            const evasiveCapability = capabilities.find(c =>
                c.system === 'helm' && c.action === 'evasive-maneuvers'
            );
            if (evasiveCapability) {
                steps.push({
                    system: 'helm',
                    action: 'evasive-maneuvers',
                    status: 'pending',
                    readyAt: evasiveCapability.readyAt,
                    cardId: evasiveCapability.cardId,
                    reasoning: 'Evasive maneuvers to minimize damage',
                });
            }
        }

        // Step 3: Scan target (if sensors has capability)
        const scanCapability = capabilities.find(c =>
            c.system === 'sensors' && c.action === 'scan-target'
        );
        if (scanCapability) {
            steps.push({
                system: 'sensors',
                action: 'scan-target',
                status: 'pending',
                readyAt: scanCapability.readyAt,
                cardId: scanCapability.cardId,
                target: scanCapability.target,
                reasoning: 'Scan target for weak points',
            });
        }

        // Step 4: Equip weapons if needed
        const equipCapability = capabilities.find(c =>
            c.system === 'tactical' && c.action === 'equip-weapon'
        );
        if (equipCapability) {
            steps.push({
                system: 'tactical',
                action: 'equip-weapon',
                status: 'pending',
                readyAt: equipCapability.readyAt,
                cardId: equipCapability.cardId,
                target: equipCapability.target,
                reasoning: 'Equip weapon for attack',
            });
        }

        // Step 5: Fire at target
        const fireCapability = capabilities.find(c =>
            c.system === 'tactical' && c.action === 'fire-weapon'
        );
        if (fireCapability) {
            steps.push({
                system: 'tactical',
                action: 'fire-weapon',
                status: 'pending',
                readyAt: fireCapability.readyAt,
                cardId: fireCapability.cardId,
                target: { type: 'enemy', id: goal.targetId ?? '' },
                reasoning: 'Fire on target',
            });
        }

        // Step 6: Repair if engineer has concerns
        const repairCapability = capabilities.find(c =>
            c.system === 'engineer' && c.action === 'repair-system'
        );
        if (repairCapability && wants.some(w => w.system === 'engineer' && w.type === 'time-to-prepare')) {
            steps.push({
                system: 'engineer',
                action: 'repair-system',
                status: 'pending',
                readyAt: repairCapability.readyAt,
                cardId: repairCapability.cardId,
                target: repairCapability.target,
                reasoning: 'Perform repairs during engagement',
            });
        }
    }

    /**
     * Resolve range conflict between different system wants.
     */
    private resolveRangeConflict(rangeWants: SystemWant[]): 'close' | 'far' {
        let closeScore = 0;
        let farScore = 0;

        for (const want of rangeWants) {
            if (want.type === 'close-range') {
                closeScore += want.priority;
            } else if (want.type === 'long-range') {
                farScore += want.priority;
            }
        }

        return closeScore >= farScore ? 'close' : 'far';
    }

    /**
     * Build flee sequence steps.
     */
    private buildFleeSteps(
        steps: PlanStep[],
        _wants: SystemWant[],
        capabilities: SystemCapability[],
        goal: StrategicGoal,
        _currentTime: number
    ): void {
        // Step 1: Retreat from target
        const retreatCapability = capabilities.find(c =>
            c.system === 'helm' && c.action === 'retreat-from-target'
        );
        if (retreatCapability) {
            steps.push({
                system: 'helm',
                action: 'retreat-from-target',
                status: 'pending',
                readyAt: retreatCapability.readyAt,
                cardId: retreatCapability.cardId,
                target: { type: 'location', id: goal.targetId ?? '' },
                reasoning: 'Retreat from threat',
            });
        }

        // Step 2: Evasive maneuvers
        const evasiveCapability = capabilities.find(c =>
            c.system === 'helm' && c.action === 'evasive-maneuvers'
        );
        if (evasiveCapability) {
            steps.push({
                system: 'helm',
                action: 'evasive-maneuvers',
                status: 'pending',
                readyAt: evasiveCapability.readyAt,
                cardId: evasiveCapability.cardId,
                reasoning: 'Evasive maneuvers while retreating',
            });
        }

        // Step 3: Defensive countermeasures
        const defensiveCapability = capabilities.find(c =>
            c.system === 'engineer' && c.action === 'defensive-action'
        );
        if (defensiveCapability) {
            steps.push({
                system: 'engineer',
                action: 'defensive-action',
                status: 'pending',
                readyAt: defensiveCapability.readyAt,
                cardId: defensiveCapability.cardId,
                reasoning: 'Deploy countermeasures',
            });
        }

        // Step 4: Repair critical systems
        const repairCapability = capabilities.find(c =>
            c.system === 'engineer' && c.action === 'repair-system'
        );
        if (repairCapability) {
            steps.push({
                system: 'engineer',
                action: 'repair-system',
                status: 'pending',
                readyAt: repairCapability.readyAt,
                cardId: repairCapability.cardId,
                target: repairCapability.target,
                reasoning: 'Repair damage while fleeing',
            });
        }
    }

    /**
     * Build patrol sequence steps.
     */
    private buildPatrolSteps(
        steps: PlanStep[],
        _wants: SystemWant[],
        capabilities: SystemCapability[],
        _goal: StrategicGoal,
        _currentTime: number
    ): void {
        // Step 1: Move to next waypoint
        const moveCapability = capabilities.find(c =>
            c.system === 'helm' && c.action === 'approach-target'
        );
        if (moveCapability) {
            steps.push({
                system: 'helm',
                action: 'approach-target',
                status: 'pending',
                readyAt: moveCapability.readyAt,
                cardId: moveCapability.cardId,
                target: moveCapability.target,
                reasoning: 'Move to patrol waypoint',
            });
        }

        // Step 2: Scan area
        const scanCapability = capabilities.find(c =>
            c.system === 'sensors' && c.action === 'scan-area'
        );
        if (scanCapability) {
            steps.push({
                system: 'sensors',
                action: 'scan-area',
                status: 'pending',
                readyAt: scanCapability.readyAt,
                cardId: scanCapability.cardId,
                reasoning: 'Scan patrol area',
            });
        }
    }

    /**
     * Build repair sequence steps.
     */
    private buildRepairSteps(
        steps: PlanStep[],
        _wants: SystemWant[],
        capabilities: SystemCapability[],
        _goal: StrategicGoal,
        _currentTime: number
    ): void {
        // Focus on repairs
        const repairCapabilities = capabilities.filter(c =>
            c.system === 'engineer' && c.action === 'repair-system'
        );

        for (const repairCap of repairCapabilities) {
            steps.push({
                system: 'engineer',
                action: 'repair-system',
                status: 'pending',
                readyAt: repairCap.readyAt,
                cardId: repairCap.cardId,
                target: repairCap.target,
                reasoning: 'Critical repair',
            });
        }

        // Evasive maneuvers while repairing
        const evasiveCapability = capabilities.find(c =>
            c.system === 'helm' && c.action === 'evasive-maneuvers'
        );
        if (evasiveCapability) {
            steps.push({
                system: 'helm',
                action: 'evasive-maneuvers',
                status: 'pending',
                readyAt: evasiveCapability.readyAt,
                cardId: evasiveCapability.cardId,
                reasoning: 'Avoid damage while repairing',
            });
        }
    }

    /**
     * Build defend position steps.
     */
    private buildDefendSteps(
        steps: PlanStep[],
        _wants: SystemWant[],
        capabilities: SystemCapability[],
        _goal: StrategicGoal,
        _currentTime: number
    ): void {
        // Hold position
        const holdCapability = capabilities.find(c =>
            c.system === 'helm' && c.action === 'hold-position'
        );
        if (holdCapability) {
            steps.push({
                system: 'helm',
                action: 'hold-position',
                status: 'pending',
                readyAt: holdCapability.readyAt,
                cardId: holdCapability.cardId,
                reasoning: 'Hold defensive position',
            });
        }

        // Continuous scanning
        const scanCapability = capabilities.find(c =>
            c.system === 'sensors' && c.action === 'scan-area'
        );
        if (scanCapability) {
            steps.push({
                system: 'sensors',
                action: 'scan-area',
                status: 'pending',
                readyAt: scanCapability.readyAt,
                cardId: scanCapability.cardId,
                reasoning: 'Monitor for threats',
            });
        }

        // Ready weapons
        const equipCapability = capabilities.find(c =>
            c.system === 'tactical' && c.action === 'equip-weapon'
        );
        if (equipCapability) {
            steps.push({
                system: 'tactical',
                action: 'equip-weapon',
                status: 'pending',
                readyAt: equipCapability.readyAt,
                cardId: equipCapability.cardId,
                target: equipCapability.target,
                reasoning: 'Prepare weapons for defense',
            });
        }
    }

    /**
     * Update an existing action plan with new information.
     */
    private updateActionPlan(plan: ActionPlan, reports: SystemReport[], currentTime: number): void {
        plan.lastReassessedAt = currentTime;

        // Update step readiness based on new capabilities
        const allCapabilities = reports.flatMap(r => r.capabilities);

        for (const step of plan.steps) {
            if (step.status === 'pending' || step.status === 'blocked') {
                // Find matching capability
                const capability = allCapabilities.find(c =>
                    c.system === step.system && c.action === step.action
                );

                if (capability) {
                    step.readyAt = capability.readyAt;
                    step.cardId = capability.cardId;

                    // Check if step is now ready
                    if (capability.readyAt === null || capability.readyAt <= currentTime) {
                        step.status = 'ready';
                    } else {
                        step.status = 'pending';
                    }
                } else {
                    step.status = 'blocked';
                }
            }
        }

        // Check if plan is complete
        const allCompleted = plan.steps.every(s => s.status === 'completed');
        const anyBlocked = plan.steps.some(s => s.status === 'blocked');

        if (allCompleted) {
            plan.phase = 'completed';
        } else if (plan.steps.some(s => s.status === 'executing' || s.status === 'ready')) {
            plan.phase = 'executing';
        } else if (anyBlocked && !plan.steps.some(s => s.status === 'ready' || s.status === 'pending')) {
            plan.phase = 'abandoned';
        }
    }

    /**
     * Execute any steps that are ready.
     */
    private executeReadySteps(_currentTime: number): void {
        if (!this.currentPlan) return;

        for (const step of this.currentPlan.steps) {
            if (step.status === 'ready' && step.cardId !== undefined) {
                const controller = this.getSystemController(step.system);
                const systemState = this.getSystemState(step.system);

                // Check if we have enough energy
                if (systemState.energy >= this.getStepCost(step)) {
                    const success = controller.executeAction(
                        this.ship,
                        systemState,
                        step.cardId,
                        step.target?.type ?? 'no-target',
                        step.target?.id ?? ''
                    );

                    if (success) {
                        step.status = 'completed';
                        console.log(`[AI] ${this.ship.id} executed ${step.action}: ${step.reasoning}`);
                    } else {
                        step.status = 'blocked';
                        console.log(`[AI] ${this.ship.id} failed to execute ${step.action}`);
                    }
                }
            }
        }
    }

    /**
     * Get the energy cost of a step.
     */
    private getStepCost(_step: PlanStep): number {
        // TODO: Look up actual cost from card definition
        return 1;
    }

    /**
     * Get the system controller for a given role.
     */
    private getSystemController(role: CrewRoleName): HelmAiController | SensorsAiController | TacticalAiController | EngineerAiController {
        switch (role) {
            case 'helm':
                return this.helmAi;
            case 'sensors':
                return this.sensorsAi;
            case 'tactical':
                return this.tacticalAi;
            case 'engineer':
                return this.engineerAi;
        }
    }

    /**
     * Get the system state for a given crew role.
     */
    private getSystemState(role: CrewRoleName): SystemState {
        switch (role) {
            case 'helm':
                return this.ship.helmState;
            case 'sensors':
                return this.ship.sensorState;
            case 'tactical':
                return this.ship.tacticalState;
            case 'engineer':
                return this.ship.engineerState;
        }
    }
}

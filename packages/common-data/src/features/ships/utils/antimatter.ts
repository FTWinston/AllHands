import type { SectorNodeInfo } from 'src/features/sectors/types/SectorNodeInfo';

/** Antimatter awarded to each player ship on completing an encounter, by the kind of node it was. Repair stations award nothing. */
export const antimatterRewards = {
    combat: 10,
    elite: 30,
    boss: 50,
} as const;

/** How much antimatter completing the encounter at the given node awards each player ship. */
export function getAntimatterReward(node: Pick<SectorNodeInfo, 'kind' | 'elite'>): number {
    switch (node.kind) {
        case 'combat':
            return node.elite ? antimatterRewards.elite : antimatterRewards.combat;
        case 'boss':
            return antimatterRewards.boss;
        default:
            return 0;
    }
}

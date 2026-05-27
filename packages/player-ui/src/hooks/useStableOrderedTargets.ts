import { GameObjectInfo, ObjectId, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useRef } from 'react';

export function useStableOrderedTargets(objects: Record<string, GameObjectInfo>, localShip: ShipInfo): GameObjectInfo[] {
    const insertionOrder = useRef<ObjectId[]>([]);
    const allTargets = Object.values(objects).filter(obj => obj !== localShip);

    for (const obj of allTargets) {
        if (!insertionOrder.current.includes(obj.id)) {
            insertionOrder.current.push(obj.id);
        }
    }

    return allTargets.sort(
        (a, b) => insertionOrder.current.indexOf(a.id) - insertionOrder.current.indexOf(b.id)
    );
}

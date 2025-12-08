import { getStateCallbacks, type Room } from 'colyseus.js';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useEffect, useState } from 'react';
import type { GameState } from 'engine/classes/state/GameState';

export const useGameObjects = (room: Room<GameState>) => {
    const [objects, setObjects] = useState<GameObjectInfo[]>([]);

    useEffect(() => {
        const callbacks = getStateCallbacks(room);

        // Helper to force a React re-render by getting an array of the latest object states.
        const refreshObjects = () => {
            setObjects([...room.state.objects.values()]);
        };

        // When an obect is added to the array...
        const unbindAdd = callbacks(room.state.objects).onAdd((object) => {
            console.log('Object added:', object);

            // Listen for changes on THIS specific object instance.
            callbacks(object).onChange(() => {
                console.log('Object field changed');
                refreshObjects();
            });

            // Trigger update to show the new object immediately.
            refreshObjects();
        });

        // When an object is removed from the array.
        const unbindRemove = callbacks(room.state.objects).onRemove(() => {
            console.log('Object removed');
            refreshObjects();
        });

        // Initialize state immediately if joining late.
        refreshObjects();

        return () => {
            unbindAdd();
            unbindRemove();
        };
    }, [room]);

    return objects;
};

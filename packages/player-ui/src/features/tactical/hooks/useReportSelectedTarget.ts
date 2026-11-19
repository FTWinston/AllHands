import { useEffect } from 'react';

/**
 * Tell the server which target tactical is showing, whenever it changes, so that the rest of the crew's screens can mark it.
 * An empty id says there's none. The server checks the target, and clears it when that target goes.
 */
export function useReportSelectedTarget(targetId: string | null, onTargetSelected: ((targetId: string) => void) | undefined) {
    useEffect(() => {
        onTargetSelected?.(targetId ?? '');
    }, [targetId, onTargetSelected]);
}

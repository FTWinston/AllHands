export type ObjectiveInfo
    = | { type: 'destroyAll' }
        | { type: 'survive'; durationMs: number }
        | { type: 'boss' };

export type ObjectiveType = ObjectiveInfo['type'];

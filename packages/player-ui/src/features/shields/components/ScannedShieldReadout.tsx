import { ShieldTuningEffect } from 'common-data/features/ships/utils/shieldStats';
import { ScannedHullInfo } from 'common-data/features/space/types/GameObjectInfo';
import { TargetReadout } from 'src/components/TargetReadout';

type Props = {
    scannedHull: ScannedHullInfo;
    className?: string;
};

const tuningNotes: Record<ShieldTuningEffect, string> = {
    shieldReinforced: 'Reinforced',
    shieldTunedEnergy: 'Tuned vs energy',
    shieldTunedTorpedo: 'Tuned vs torpedoes',
};

/** A scanned target's shields, and their current tuning, if any. */
export const ScannedShieldReadout = ({ scannedHull, className }: Props) => (
    <TargetReadout
        label="Shield"
        side="start"
        note={scannedHull.shieldTuning ? tuningNotes[scannedHull.shieldTuning] : undefined}
        className={className}
    >
        {scannedHull.shield}
        {' / '}
        {scannedHull.maxShield}
    </TargetReadout>
);

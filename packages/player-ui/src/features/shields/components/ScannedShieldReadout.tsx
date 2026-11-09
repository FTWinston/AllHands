import { ScannedHullInfo } from 'common-data/features/space/types/GameObjectInfo';
import { TargetReadout } from 'src/components/TargetReadout';

type Props = {
    scannedHull: ScannedHullInfo;
    className?: string;
};

const tuningNotes = {
    energy: 'Tuned vs energy',
    torpedo: 'Tuned vs torpedoes',
};

/** A scanned target's shields, and what weapon type they're currently tuned against, if any. */
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

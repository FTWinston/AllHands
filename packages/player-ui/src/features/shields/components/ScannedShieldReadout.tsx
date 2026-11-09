import { ShieldTuning } from 'common-data/features/ships/utils/shieldStats';
import { ScannedHullInfo } from 'common-data/features/space/types/GameObjectInfo';
import { TargetReadout } from 'src/components/TargetReadout';

type Props = {
    scannedHull: ScannedHullInfo;
    className?: string;
};

const tuningNames: Record<ShieldTuning, string> = {
    energy: 'energy',
    torpedo: 'torpedoes',
};

/** A scanned target's shields, and what weapon types they're currently tuned against, if any. */
export const ScannedShieldReadout = ({ scannedHull, className }: Props) => {
    const tunings = [...scannedHull.shieldTuning];

    return (
        <TargetReadout
            label="Shield"
            side="start"
            note={tunings.length > 0 ? `Tuned vs ${tunings.map(tuning => tuningNames[tuning]).join(' & ')}` : undefined}
            className={className}
        >
            {scannedHull.shield}
            {' / '}
            {scannedHull.maxShield}
        </TargetReadout>
    );
};

import { Button } from 'common-ui/components/Button';
import { getNodeKindLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { FC } from 'react';
import { describeEncounter } from '../../../utils/describeEncounter';
import styles from './EncounterSelector.module.css';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

type Props = {
    encounters: readonly DevEncounterInfo[];
    loadEncounter: (encounterId: string) => void;
};

const kindOrder: SectorNodeKind[] = ['combat', 'repair', 'boss'];

export const EncounterSelector: FC<Props> = ({ encounters, loadEncounter }) => {
    if (encounters.length === 0) {
        return <p>No encounters received from the server.</p>;
    }

    return (
        <div className={styles.root}>
            {kindOrder.map((kind) => {
                const group = encounters.filter(encounter => encounter.kind === kind);
                if (group.length === 0) {
                    return null;
                }

                return (
                    <section key={kind}>
                        <h4 className={styles.groupHeader}>{getNodeKindLabel(kind)}</h4>
                        <ul className={styles.list}>
                            {group.map((encounter) => {
                                const { environment, faction, objective } = describeEncounter(encounter);
                                const details = [environment, faction, objective].filter(Boolean).join(' · ');

                                return (
                                    <li key={encounter.id}>
                                        <Button className={styles.encounter} onClick={() => loadEncounter(encounter.id)}>
                                            <span className={styles.name}>{encounter.name}</span>
                                            {details && <span className={styles.details}>{details}</span>}
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
};

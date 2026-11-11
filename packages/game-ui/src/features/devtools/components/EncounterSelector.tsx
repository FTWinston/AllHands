import { stationKinds } from 'common-data/features/sectors/utils/isStationKind';
import { Button } from 'common-ui/components/Button';
import { getNodeKindLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { FC } from 'react';
import { describeEncounter } from '../../../utils/describeEncounter';
import styles from './EncounterSelector.module.css';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

type Props = {
    encounters: readonly DevEncounterInfo[];
    loadEncounter: (encounterId: string, elite: boolean) => void;
};

const kindOrder: SectorNodeKind[] = ['combat', ...stationKinds, 'boss'];

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
                                const { environment, objective } = describeEncounter(encounter);
                                const details = [environment, objective].filter(Boolean).join(' · ');

                                return (
                                    <li key={encounter.id} className={styles.item}>
                                        <Button className={styles.encounter} onClick={() => loadEncounter(encounter.id, false)}>
                                            <span className={styles.name}>{encounter.name}</span>
                                            {details && <span className={styles.details}>{details}</span>}
                                        </Button>
                                        {encounter.hasElite && (
                                            <Button
                                                className={styles.elite}
                                                palette="danger"
                                                title={`${encounter.name}, elite form`}
                                                onClick={() => loadEncounter(encounter.id, true)}
                                            >
                                                Elite
                                            </Button>
                                        )}
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

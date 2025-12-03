import { ShipAppearance, Vulnerability } from 'common-types';
import { classNames } from 'common-ui/utils/classNames';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ShipIcon } from 'common-ui/icons/ships';
import { CardDropTarget } from 'src/features/cardhand/components/CardDropTarget';
import styles from './Target.module.css';
import { VulnerabilityList } from './VulnerabilityList';

export type TargetInfo = {
    id: string;
    appearance: ShipAppearance;
    vulnerabilities?: Vulnerability[];
};

type Props = TargetInfo & {
    targetNumber: number;
    totalTargets: number;
    selectedVulnerability: Vulnerability | null;
    selectVulnerability?: (vulnerability: Vulnerability | null) => void;
};

export const Target = (props: Props) => {
    return (
        <CardDropTarget
            targetType="enemy"
            id={props.id}
            className={classNames(
                styles.target,
                colorPalettes.primary,
                props.selectedVulnerability ? styles.vulnerabilitySelected : null,
                props.vulnerabilities && props.vulnerabilities.length > 0 ? styles.hasVulnerabilities : null
            )}
            disabled={!!props.selectedVulnerability}
        >
            <h2 className={styles.name}>{props.id}</h2>

            <div className={styles.count}>
                #
                {' '}
                {props.targetNumber}
                {' '}
                /
                {' '}
                {props.totalTargets}
            </div>

            <ShipIcon
                appearance={props.appearance}
                className={classNames(styles.image, props.selectedVulnerability ? styles.imageWithSelectedVulnerability : undefined)}
            />

            <VulnerabilityList
                className={styles.vulnerabilities}
                vulnerabilities={props.vulnerabilities ?? []}
                selectedVulnerability={props.selectedVulnerability}
                selectVulnerability={props.selectVulnerability}
                targetId={props.id}
            />
        </CardDropTarget>
    );
};

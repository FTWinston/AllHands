import { ShipAppearance, Vulnerability } from 'common-types';
import { classNames } from 'common-ui/classNames';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ShipIcon } from 'common-ui/icons/ships';
import { CardDropTarget } from 'src/components/CardDropTarget';
import styles from './Target.module.css';
import { VulnerabilityIndicator } from './VulnerabilityIndicator';

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
    const { selectVulnerability } = props;

    return (
        <CardDropTarget
            targetType="enemy"
            id={props.id}
            className={classNames(styles.target, colorPalettes.primary, props.selectedVulnerability ? styles.vulnerabilitySelected : null)}
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

            <div className={styles.vulnerabilities}>
                {props.vulnerabilities && props.vulnerabilities.length > 0
                    ? props.vulnerabilities.map(vulnerability => (
                        <VulnerabilityIndicator
                            key={vulnerability}
                            targetId={props.id}
                            vulnerability={vulnerability}
                            isSelected={props.selectedVulnerability === vulnerability}
                            anySelected={!!props.selectedVulnerability}
                            onSelected={isSelected => selectVulnerability?.(isSelected ? vulnerability : null)}
                        />
                    ))
                    : <>No vulnerabilities detected</>}
            </div>
        </CardDropTarget>
    );
};

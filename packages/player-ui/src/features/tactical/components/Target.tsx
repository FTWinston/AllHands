import { ShipAppearance, Vulnerability } from 'common-types';
import { classNames } from 'common-ui/classNames';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ShipIcon } from 'common-ui/icons/ships';
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
    selectVulnerability: (vulnerability: Vulnerability | null) => void;
};

export const Target = (props: Props) => {
    const { selectVulnerability } = props;

    return (
        <div className={classNames(styles.target, colorPalettes.primary)}>
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
                className={styles.image}
            />

            <div className={styles.vulnerabilities}>
                {props.vulnerabilities && props.vulnerabilities.length > 0
                    ? props.vulnerabilities.map(vulnerability => (
                        <VulnerabilityIndicator
                            key={vulnerability}
                            vulnerability={vulnerability}
                            isSelected={props.selectedVulnerability === vulnerability}
                            anySelected={!!props.selectedVulnerability}
                            onSelected={isSelected => selectVulnerability(isSelected ? vulnerability : null)}
                        />
                    ))
                    : <>No vulnerabilities detected</>}
            </div>
        </div>
    );
};

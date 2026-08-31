import { SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { getSubTargetDescription } from 'common-ui/utils/getSubTargetDescription';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import styles from './SubTargetIndicator.module.css';

type Props = {
    subTarget: SubTargetInfo;
    targetId: string;
    index: number;
    disabled?: boolean;
    hidden?: boolean;
};

export const SubTargetIndicator = (props: Props) => {
    // TODO: different descriptions for vulnerabilities as opposed to just targeting a system.
    const { name, description, image } = getSubTargetDescription(props.subTarget.system);

    // Vulnerability sub-targets have an id of 'system:vulnerabilityId', whereas plain system sub-targets just use the system name.
    const isVulnerability = props.subTarget.id.includes(':');

    return (
        <CardDropTarget
            targetType="enemy"
            id={`${props.targetId}:${props.subTarget.id}`}
            disabled={props.disabled}
            className={styles.dropTarget}
            // @ts-expect-error CSS custom property
            style={{ '--index': props.index }}
        >
            <InfoPopup
                className={styles.vulnerability}
                name={name}
                description={description}
                palette={isVulnerability ? 'good' : 'danger'}
            >
                {image}
            </InfoPopup>
        </CardDropTarget>
    );
};

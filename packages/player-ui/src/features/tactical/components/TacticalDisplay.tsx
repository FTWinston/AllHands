import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, RelationshipViewer, ScannedHullInfo, TargetSubTargets, WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { ComponentProps, PropsWithChildren, useCallback, useRef, useState } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { useReportSelectedTarget } from '../hooks/useReportSelectedTarget';
import { ShotResult } from '../utils/shotResults';
import { canPlayOnWeapon } from '../utils/weaponCards';
import { ShotToasts } from './ShotToasts';
import { TacticalTargetList } from './TacticalTargetList';
import { WeaponSlots } from './WeaponSlots';

type Props = PropsWithChildren<Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    power: number;
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    ejectWeapon: (slotId: string) => void;
    cards: Snapshot<CardInstance[]>;
    slots: Snapshot<WeaponSlotInfo[]>;
    shipMotion: GameObjectInfo['motion'];
    targets: Snapshot<GameObjectInfo[]>;
    subTargetsByTarget: Partial<Record<string, TargetSubTargets>>;
    /** The hull of the ship science is scanning, if any. */
    scannedHull: ScannedHullInfo | null;
    viewer: RelationshipViewer;
    /** What the crew calls each contact, by object id. */
    contactLabels?: Partial<Record<string, string>>;
    /** Called with the id of the target being shown whenever it changes, or empty if there's none, so the rest of the crew can see it. */
    onTargetSelected?: (targetId: string) => void;
    /** The id of the ship that Lock is held against. Empty while there's no Lock. */
    lockTargetId: string;
    /** How many levels of Lock are held against that ship. */
    lockLevel: number;
    /** Whether weapons can't fire just now (see the Hold Fire card). */
    holdingFire?: boolean;
    /** Whether the helm is holding the ship steady, so that cumbersome weapons needn't hold their aim. */
    aimSteadied?: boolean;
    /** Whether our recent shots hit or missed, oldest first. */
    shotResults?: readonly ShotResult[];
    /** Whether shot results stay put rather than fading out. For stories. */
    persistentShotResults?: boolean;
}>;

export const TacticalDisplay = (props: Props) => {
    const { cards, slots, playCard, ejectWeapon, targets, subTargetsByTarget, scannedHull, viewer, lockTargetId, lockLevel, holdingFire, aimSteadied, shotResults, persistentShotResults, children, contactLabels, onTargetSelected, ...headerProps } = props;

    useRootClassName(crewStyles.tactical);

    const timeProvider = useTimeProvider();

    // Store the index, not the target: snapshots go stale when targets move, die or are replaced.
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
    const currentTarget = targets[Math.min(currentTargetIndex, targets.length - 1)] ?? null;

    useReportSelectedTarget(currentTarget?.id ?? null, onTargetSelected);

    const currentTime = timeProvider.getServerTime();
    const firingSolution = currentTarget === null
        ? null
        : getFiringSolution(props.shipMotion, currentTarget.motion, currentTime);

    // Remember every target's name, so a result can still name one that has since been destroyed.
    const targetNames = useRef(new Map<string, string>());
    for (const target of targets) {
        targetNames.current.set(target.id, target.name);
    }
    const getTargetName = useCallback((targetId: string) => targetNames.current.get(targetId), []);

    // A card is highlighted if it can be played on at least one loaded weapon: one with no modifier yet, or any at all for an instant card.
    const isCardHighlighted = useCallback(
        (card: Snapshot<CardInstance>) => {
            const definition = getCardDefinition(card.type);
            return definition.targetType === 'weapon' && slots.some(slot => canPlayOnWeapon(definition, slot));
        },
        [slots]
    );

    return (
        <Screen>
            <CardUI
                playCard={playCard}
                cardHand={cards}
                availablePower={headerProps.power}
                isCardHighlighted={isCardHighlighted}
            >
                <CrewHeader
                    crew="tactical"
                    {...headerProps}
                />

                <TacticalTargetList
                    targets={targets}
                    subTargetsByTarget={subTargetsByTarget}
                    scannedHull={scannedHull}
                    onVisibleTargetChange={setCurrentTargetIndex}
                    targetAspect={firingSolution?.targetAspect}
                    viewer={viewer}
                    contactLabels={contactLabels}
                    lockTargetId={lockTargetId}
                    lockLevel={lockLevel}
                />

                <ShotToasts
                    results={shotResults ?? []}
                    currentTargetId={currentTarget?.id ?? null}
                    getTargetName={getTargetName}
                    persistent={persistentShotResults}
                />

                <WeaponSlots
                    slots={slots}
                    firingSolution={firingSolution}
                    targetId={currentTarget?.id ?? null}
                    holdingFire={holdingFire}
                    aimSteadied={aimSteadied}
                    onEject={ejectWeapon}
                />
            </CardUI>

            {children}
        </Screen>
    );
};

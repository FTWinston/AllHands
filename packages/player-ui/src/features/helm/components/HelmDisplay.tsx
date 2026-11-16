import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FieldInfo } from 'common-data/features/space/types/FieldInfo';
import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Position } from 'common-data/features/space/types/Position';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { CardCooldown } from 'common-data/types/Cooldown';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { ComponentProps, RefObject, useCallback } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { findNearestEligibleShip, getShipTargetRelationship } from '../utils/findNearestEligibleShip';
import styles from './HelmDisplay.module.css';
import { HelmSpaceMap } from './HelmSpaceMap';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    power: number;
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: Snapshot<CardInstance[]>;
    center: ReadonlyKeyframes<Position>;
    objects: Record<string, GameObjectInfo>;
    /** The lingering zones in space, drawn on the map so they can be steered round, or into. */
    fields?: Record<string, FieldInfo>;
    viewer: RelationshipViewer;
    activeManeuver?: CardCooldown | null;
    cancelManeuver: () => void;
    /** Whether the ship is held in another's tractor beam. */
    isHeld?: boolean;
    weaponEffectsRef: RefObject<WeaponEffect[]>;
};

export const HelmDisplay = (props: Props) => {
    const { cards, playCard, center, objects, fields, viewer, activeManeuver, cancelManeuver, isHeld, weaponEffectsRef, ...headerProps } = props;

    useRootClassName(crewStyles.helm);

    const timeProvider = useTimeProvider();

    // A ship card dropped on the map is played on the eligible ship nearest the hexagon it was dropped on, as the map showed while it was dragged.
    const playCardOnTarget = useCallback((cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => {
        if (targetType !== 'ship') {
            playCard(cardId, cardType, targetType, targetId);
            return;
        }

        const relationship = getShipTargetRelationship(cardType);
        const location = parseVector(targetId);
        const target = relationship !== null && location
            ? findNearestEligibleShip(objects, viewer, location, relationship, timeProvider.getServerTime())
            : null;

        if (target) {
            playCard(cardId, cardType, targetType, target.ship.id);
        }
    }, [playCard, objects, viewer, timeProvider]);

    return (
        <Screen>
            <CardUI
                playCard={playCardOnTarget}
                cardHand={cards}
                availablePower={headerProps.power}
            >
                <CrewHeader
                    crew="helm"
                    {...headerProps}
                />

                {isHeld && (
                    <p className={styles.notice} role="status">
                        Held by a tractor beam. Manoeuvre to try breaking free.
                    </p>
                )}

                <HelmSpaceMap
                    center={center}
                    objects={objects}
                    fields={fields}
                    viewer={viewer}
                    activeManeuver={activeManeuver}
                    cancelManeuver={cancelManeuver}
                    weaponEffectsRef={weaponEffectsRef}
                />
            </CardUI>
        </Screen>
    );
};

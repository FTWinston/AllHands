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
import { CardCooldown, Cooldown } from 'common-data/types/Cooldown';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ContactLabels } from 'common-ui/features/spacemap/utils/drawContactLabels';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { ComponentProps, RefObject, useCallback } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { findNearestEligibleShip, getShipTargetRelationship } from '../utils/findNearestEligibleShip';
import { isHelmCardPlayable } from '../utils/isHelmCardPlayable';
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
    /** What this ship's crew calls each contact, by object id. */
    contactLabels?: ContactLabels;
    /** The id of the object tactical is aiming at. */
    tacticalTargetId?: string;
    /** The id of the ship science is scanning. */
    scienceTargetId?: string;
    activeManeuver?: CardCooldown | null;
    /** How many levels of Momentum the ship has. */
    momentumLevel?: number;
    /** When the ship next loses a level of Momentum, as it has been still for a while. */
    momentumFade?: Cooldown | null;
    cancelManeuver: () => void;
    weaponEffectsRef: RefObject<WeaponEffect[]>;
};

export const HelmDisplay = (props: Props) => {
    const { cards, playCard, center, objects, fields, viewer, contactLabels, tacticalTargetId, scienceTargetId, activeManeuver, momentumLevel, momentumFade, cancelManeuver, weaponEffectsRef, ...headerProps } = props;

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

    // Cards that need or spend Momentum are greyed out without enough of it.
    const isCardPlayable = useCallback(
        (card: Snapshot<CardInstance>) => isHelmCardPlayable(card, { momentumLevel: momentumLevel ?? 0 }),
        [momentumLevel]
    );

    return (
        <Screen>
            <CardUI
                playCard={playCardOnTarget}
                cardHand={cards}
                availablePower={headerProps.power}
                isCardPlayable={isCardPlayable}
            >
                <CrewHeader
                    crew="helm"
                    {...headerProps}
                />

                <HelmSpaceMap
                    center={center}
                    objects={objects}
                    fields={fields}
                    viewer={viewer}
                    contactLabels={contactLabels}
                    tacticalTargetId={tacticalTargetId}
                    scienceTargetId={scienceTargetId}
                    activeManeuver={activeManeuver}
                    momentumLevel={momentumLevel}
                    momentumFade={momentumFade}
                    cancelManeuver={cancelManeuver}
                    weaponEffectsRef={weaponEffectsRef}
                />
            </CardUI>
        </Screen>
    );
};

import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Position } from 'common-data/features/space/types/Position';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { CardCooldown } from 'common-data/types/Cooldown';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ComponentProps, MutableRefObject } from 'react';
import { CardUI } from 'src/features/cardui/components/CardUI';
import { useRootClassName } from 'src/hooks/useRootClassName';
import { CrewHeader } from '../../header';
import { HelmSpaceMap } from './HelmSpaceMap';

type Props = Omit<ComponentProps<typeof CrewHeader>, 'crew' | 'handSize'> & {
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cards: Snapshot<CardInstance[]>;
    center: ReadonlyKeyframes<Position>;
    objects: Record<string, GameObjectInfo>;
    activeManeuver?: CardCooldown | null;
    cancelManeuver: () => void;
    weaponEffectsRef: MutableRefObject<WeaponEffect[]>;
};

export const HelmDisplay = (props: Props) => {
    const { cards, playCard, center, objects, activeManeuver, cancelManeuver, weaponEffectsRef, ...headerProps } = props;

    useRootClassName(crewStyles.helm);

    return (
        <Screen>
            <CardUI playCard={playCard} cardHand={cards} availablePower={headerProps.power}>
                <CrewHeader
                    crew="helm"
                    handSize={cards.length}
                    {...headerProps}
                />

                <HelmSpaceMap
                    center={center}
                    objects={objects}
                    activeManeuver={activeManeuver}
                    cancelManeuver={cancelManeuver}
                    weaponEffectsRef={weaponEffectsRef}
                />
            </CardUI>
        </Screen>
    );
};

import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { Cooldown } from 'common-data/types/Cooldown';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { expect, fn } from 'storybook/test';
import { EngineerDisplay as Component } from './EngineerDisplay';
import healthBarStyles from './HealthBar.module.css';
import systemStyles from './System.module.css';
import type { SystemCards } from './SystemCardsDialog';
import type { Meta, StoryObj } from '@storybook/react-vite';

const noCards = { hand: [], deck: [] };

const helmCards = {
    hand: [{ id: 101, type: 'zigZag' }],
    deck: [
        { id: 102, type: 'slowAndSteady' },
        { id: 103, type: 'strafe', extraTraits: { damaged: ExtraTraitType.Normal } },
        { id: 104, type: 'faceTarget' },
        { id: 105, type: 'sweep', extraTraits: { expendable: ExtraTraitType.Normal } },
    ],
} satisfies SystemCards;

// A hull with every common card type, with an emitter and a bare hull card damaged: 75 shield capacity.
const hullCards = {
    hand: [],
    deck: (['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullShieldTuningTorpedo'] as const)
        .flatMap(type => [type, type])
        .map((type, index) => index === 4 || index === 6
            ? { id: 201 + index, type, extraTraits: { damaged: ExtraTraitType.Normal } }
            : { id: 201 + index, type }),
} satisfies SystemCards;

const meta: Meta<typeof Component> = {
    title: 'player-ui/Engineer/UI',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    includeStories: /^[A-Z]/,
    args: {
        onPause: fn(),
    },
    render: (args) => {
        const { cards, expendCard, cardGeneration } = useFakePowerAndCards({
            ...args,
            cards: args.cards || [],
            createCard: (id: number) => ({
                id,
                type: 'auxPower',
            }),
        });

        return (
            <Component
                {...args}
                cardGeneration={cardGeneration}
                deckSize={18}
                cards={cards}
                playCard={(cardId, targetType, targetId) => {
                    console.log(`dropped card ${cardId} on ${targetType} ${targetId}`);
                    expendCard(cardId);
                }}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

type UseFakeCardGenerationArgs = {
    power: number;
    handSize: number;
    generateCard?: () => void;
};

export const useFakeCardGeneration = (args: UseFakeCardGenerationArgs) => {
    const [handSize, setHandSize] = useState(args.handSize);
    const justChanged = useRef(false);
    const generateCard = args.generateCard;

    const { power } = args;

    const [cardGeneration, setCardGeneration] = useState<Cooldown | undefined>(undefined);

    const shouldGenerateCard = handSize < 5;

    useEffect(() => {
        justChanged.current = true;

        const adjustGeneration = () => {
            if (shouldGenerateCard) {
                setCardGeneration({ startTime: Date.now(), endTime: Date.now() + 5000 });
                if (!justChanged.current) {
                    setHandSize(handSize => Math.min(handSize + 1, 5));
                    generateCard?.();
                }
            } else {
                setCardGeneration(undefined);
            }

            justChanged.current = false;
        };

        adjustGeneration();

        const interval = setInterval(adjustGeneration, 5000);

        return () => clearInterval(interval);
    }, [shouldGenerateCard, generateCard]);

    const checkPowerAndRemoveCard = (powerCost: number) => {
        if (power >= powerCost) {
            setHandSize(handSize => Math.max(0, handSize - 1));
            return true;
        }

        return false;
    };

    return { checkPowerAndRemoveCard, handSize, cardGeneration };
};

type UseFakePowerAndCardsArgs = Omit<UseFakeCardGenerationArgs, 'handSize'> & {
    cards: Snapshot<CardInstance[]>;
    createCard: (id: number) => Snapshot<CardInstance>;
};

export const useFakePowerAndCards = (args: UseFakePowerAndCardsArgs) => {
    const [cards, setCards] = useState(args.cards);

    const createCard = args.createCard;
    const nextCardId = useRef(10);

    const generateCard = useCallback(() => {
        setCards(cards => [
            ...cards,
            createCard(nextCardId.current++),
        ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fakeCardGenerationArgs = {
        ...args,
        generateCard,
    };

    const { checkPowerAndRemoveCard, ...cardGenerationResults } = useFakeCardGeneration({ ...fakeCardGenerationArgs, handSize: cards.length });

    const expendCard = useCallback((cardId: number) => {
        setCards((cards) => {
            const playedCard = cards.find(c => c.id === cardId);
            const cost = playedCard ? getCardDefinition(playedCard.type).parameters.cost : 0;
            if (playedCard && cost && checkPowerAndRemoveCard(cost)) {
                return cards.filter(card => card !== playedCard);
            }
            return cards;
        });
    }, [checkPowerAndRemoveCard]);

    return {
        ...cardGenerationResults,
        cards,
        expendCard,
    };
};

export const UI: Story = {
    args: {
        cards: [
            {
                id: 1,
                type: 'auxPower',
            },
            {
                id: 2,
                type: 'auxPower',
            },
            {
                id: 3,
                type: 'auxPower',
            },
        ],
        systems: [
            {
                system: 'hull',
                ...(hullCards),
                health: 10,
                maxHealth: 12,
                stabilised: 0,
                damaged: 2,
                critical: 0,
                shield: 62,
                maxShield: 75,
                power: 3,
                generating: true,
                effects: [
                    {
                        type: 'shieldTunedEnergy',
                        progress: { startTime: Date.now(), endTime: Date.now() + 12000 },
                    },
                    {
                        type: 'auxPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'reducedPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'disruptGeneration',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'reactor',
                ...(noCards),
                // Lots of cards, with a single damaged and a single critically damaged one, so their counts are wider than their sections.
                health: 16,
                maxHealth: 18,
                stabilised: 4,
                damaged: 1,
                critical: 1,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'reducedPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                ],
            },
            {
                system: 'helm',
                ...(helmCards),
                health: 3,
                maxHealth: 4,
                stabilised: 0,
                damaged: 1,
                critical: 0,
                power: 5,
                generating: false,
            },
            {
                system: 'science',
                ...(noCards),
                health: 4,
                maxHealth: 8,
                stabilised: 3,
                damaged: 0,
                critical: 4,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'reducedPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'disruptGeneration',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'auxPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'feedback',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'redlining',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'shieldFocus',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'shieldReduced',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'resetting',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'tactical',
                ...(noCards),
                health: 8,
                maxHealth: 8,
                stabilised: 0,
                damaged: 0,
                critical: 0,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'auxPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'reducedPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'disruptGeneration',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'feedback',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'redlining',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'shieldFocus',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'engineer',
                ...(noCards),
                health: 0,
                maxHealth: 8,
                stabilised: 0,
                damaged: 3,
                critical: 5,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'reducedPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'redlining',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'disruptGeneration',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'auxPower',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'feedback',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
        ],
        repairCapacity: 12,
        maxRepairCapacity: 12,
        power: 5,
    },
};

/**
 * Resize the browser to the given size, as the test runner can. Storybook itself can't (vitest/browser only loads under the test runner),
 * so there the story is checked at whatever size the window is, rather than failing to render.
 */
async function setViewport(width: number, height: number): Promise<boolean> {
    try {
        const { page } = await import('vitest/browser');
        await page.viewport(width, height);
        return true;
    } catch {
        // Not under the test runner.
        return false;
    }
}

/** What's at the middle of the element, as a tap there would find it. */
function elementAtMiddleOf(element: Element) {
    const rect = element.getBoundingClientRect();
    return element.ownerDocument.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

/** Badges, which stick out of the tile's corners. */
const isOnEdge = (element: Element) => !!element.closest(`.${systemStyles.badge}`);

/**
 * Every tile's contents fit it, and tapping its health opens its cards, as the cards button covers the tile.
 * Its effects, which are buttons too, open their own descriptions instead. Its badges let taps through, to the cards button where they're on the tile.
 */
const expectTilesFitAndOpenCards = async (canvasElement: HTMLElement, width: number, height: number) => {
    if (await setViewport(width, height)) {
        await expect(canvasElement.ownerDocument.defaultView!.innerWidth).toBe(width);
    }

    // Effects slide into place as they're added.
    const { CSSTransition } = canvasElement.ownerDocument.defaultView as unknown as { CSSTransition: typeof Animation };
    await Promise.all(canvasElement.ownerDocument.getAnimations().filter(animation => animation instanceof CSSTransition).map(animation => animation.finished));

    for (const system of ['hull', 'reactor', 'helm', 'science', 'tactical', 'engineer']) {
        const cardsButton = canvasElement.querySelector(`button[aria-label="View ${system} cards"]`)!;
        const tile = cardsButton.closest('h2')!.parentElement!;

        const edge = tile.getBoundingClientRect();
        const overhanging = [...tile.querySelectorAll('*')]
            .filter(element => !isOnEdge(element))
            .map(element => ({ element, rect: element.getBoundingClientRect() }))
            .filter(({ rect }) => rect.left < edge.left - 1 || rect.top < edge.top - 1 || rect.right > edge.right + 1 || rect.bottom > edge.bottom + 1)
            .map(({ element }) => `${element.tagName}.${element.getAttribute('class')}`);
        await expect(overhanging, `${system} tile's contents overhanging it`).toEqual([]);

        for (const image of [...tile.querySelectorAll('[role="img"]')].filter(element => !isOnEdge(element))) {
            await expect(elementAtMiddleOf(image), `${image.getAttribute('aria-label')} on the ${system} tile`).toBe(cardsButton);
        }

        // The damage that can be repaired is beneath its section, even when it's very narrow (one card of 18), and wider than it.
        const repairable = tile.querySelector(`.${healthBarStyles.repairable}`);
        const damagedSection = tile.querySelector(`.${healthBarStyles.damaged}`);
        await expect(!!repairable, `${system} tile showing damage that can be repaired`).toBe(!!damagedSection);
        if (repairable && damagedSection) {
            const number = repairable.getBoundingClientRect();
            const section = damagedSection.getBoundingClientRect();
            await expect(number.left <= section.right && number.right >= section.left, `${system} tile's damage that can be repaired beneath its section`).toBe(true);
        }

        for (const badge of tile.querySelectorAll(`.${systemStyles.badge}`)) {
            await expect(getComputedStyle(badge).pointerEvents, `${badge.getAttribute('aria-label')} on the ${system} tile`).toBe('none');
        }

        // Lots of effects overlap one another, so another effect might be on top, but not the cards button.
        for (const other of tile.querySelectorAll('button')) {
            if (other !== cardsButton) {
                const tapped = elementAtMiddleOf(other)?.closest('button');
                await expect(tapped && tile.contains(tapped) && tapped !== cardsButton, `${other.textContent} on the ${system} tile`).toBe(true);
            }
        }
    }
};

/** The hull's tile has shields too, as dots along its border and a number. */
export const PhoneWidth: Story = {
    ...UI,
    play: ({ canvasElement }) => expectTilesFitAndOpenCards(canvasElement, 390, 844),
};

/** Wide tiles put the effects beside the name and health, rather than below them. */
export const WideWidth: Story = {
    ...UI,
    play: ({ canvasElement }) => expectTilesFitAndOpenCards(canvasElement, 1200, 900),
};

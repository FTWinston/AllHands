import { sharedContent } from 'content/content.shared';
import { mergeSharedContent, type MergedCards } from '../../../content/SharedContent';
import type { CardTargetType } from '../types/CardTargetType';

type AllCards = MergedCards<(typeof sharedContent)[number]>;

/** Every card there is. Each is defined in the `*.shared.ts` file of the content folder it belongs to. */
export const cardDefinitions = mergeSharedContent(sharedContent, 'cards') as AllCards;

export type CardType = Extract<keyof AllCards, string>;

type KeysWithTargetType<TRecord, TKey extends CardTargetType> = {
    [K in keyof TRecord]: TRecord[K] extends { targetType: TKey } ? K : never
}[keyof TRecord];

export type UntargetedCardType = KeysWithTargetType<AllCards, 'no-target'>;

export type WeaponSlotTargetedCardType = KeysWithTargetType<AllCards, 'weapon-slot'>;

export type WeaponTargetedCardType = KeysWithTargetType<AllCards, 'weapon'>;

export type SystemSlotTargetedCardType = KeysWithTargetType<AllCards, 'system'>;

export type EnemyTargetedCardType = KeysWithTargetType<AllCards, 'enemy'>;

export type ScanTargetedCardType = KeysWithTargetType<AllCards, 'scan'>;

export type LocationTargetedCardType = KeysWithTargetType<AllCards, 'location'>;

export type ChoiceCardType = KeysWithTargetType<AllCards, 'choice'>;

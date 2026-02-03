import { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { ReactNode } from 'react';

export interface CardDescription {
    name: string;
    description: ReactNode;
    image: ReactNode;
    nameFontSize?: number;
    descriptionLineHeight?: number;
}

export type UICardDefinition = CardDefinition & CardDescription;

export type UICardInstance = UICardDefinition & {
    id: number;
};

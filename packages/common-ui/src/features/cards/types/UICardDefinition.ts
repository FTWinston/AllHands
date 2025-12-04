import { CardDefinition } from 'common-data/types/CardDefinition';
import { ReactNode } from 'react';

export interface CardDescription {
    name: string;
    description: string;
    image: ReactNode;
    nameFontSize?: number;
    descriptionLineHeight?: number;
}

export type UICardDefinition = CardDefinition & CardDescription;

export type UICardInstance = UICardDefinition & {
    id: number;
};

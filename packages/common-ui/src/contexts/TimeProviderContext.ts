import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { createContext } from 'react';

export const TimeProviderContext = createContext<ITimeProvider | null>(null);

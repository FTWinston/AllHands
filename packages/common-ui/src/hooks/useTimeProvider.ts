import { useContext } from 'react';
import { TimeProviderContext } from '../contexts/TimeProviderContext';

export function useTimeProvider() {
    const timeProvider = useContext(TimeProviderContext);

    if (!timeProvider) {
        throw new Error('Must be used within a TimeProviderContext.Provider');
    }

    return timeProvider;
}

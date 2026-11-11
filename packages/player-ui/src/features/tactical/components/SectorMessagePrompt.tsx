import { FC } from 'react';
import { CommsPrompt } from './CommsPrompt';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';

type Props = {
    message: SectorMessageInfo | null;
    onDismiss: () => void;
};

const continueOptions = [{ id: 'continue', label: 'Continue' }];

/**
 * Shown to tactical while a sector intro/outro message is on the viewscreen. It's a comms prompt like any other,
 * with only one answer and no time limit, as it's meant to become someone's welcome message.
 */
export const SectorMessagePrompt: FC<Props> = ({ message, onDismiss }) => (
    <CommsPrompt
        prompt={{
            speaker: message?.title ?? 'Sector message',
            text: message?.text ?? '',
            options: continueOptions,
        }}
        onAnswer={onDismiss}
    />
);

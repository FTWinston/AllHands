import { defineAppearances, defineSharedContent } from 'common-data/content/SharedContent';

/** The drawings of the ship designs that more than one encounter uses. */
export const appearances = defineAppearances({
    'dart-fighter': { size: 'small' },
    'swallowtail-interceptor': { size: 'small' },
    'hammerhead-cruiser': { size: 'capital' },
    'manta-command-ship': { size: 'capital' },
    'mantis-drone': { size: 'small' },
});

export const shipsShared = defineSharedContent({ appearances });

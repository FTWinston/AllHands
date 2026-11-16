import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/engineerCards.shared';
import { effects } from './effects/engineerEffects.shared';

export {
    transferPowerDuration, transferPowerRange, runQuietPowerLoss, runQuietChargeInterval,
    chargeMaxLevel, fluxLimit, bankPowerLoss, bankPowerDuration, bankPowerCharge, dischargePowerPerLevel, dischargeDuration,
    redlinePowerGain, redlineFluxInterval, ventShieldsDownDuration, railFeedPowerGain, railFeedDuration,
    autoDestructConfirmWindow, autoDestructConfirmationsNeeded, autoDestructDuration, autoDestructRange, autoDestructDamage, emergencyPowerGain, emergencyPowerDuration, emergencyPowerFlux
} from './cards/engineerCards.shared';

export const engineerShared = defineSharedContent({ cards, effects });

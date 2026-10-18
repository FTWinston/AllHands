import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { minTimeScale, maxTimeScale } from 'common-data/utils/constants';
import { Button } from 'common-ui/components/Button';
import { Dialog } from 'common-ui/components/Dialog';
import { RadioGroup } from 'common-ui/components/RadioGroup';
import { Tabs } from 'common-ui/components/Tabs';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { getSystemEffectDefinition } from 'common-ui/utils/getUiSystemEffectDefinition';
import { FC, useState } from 'react';
import styles from './DevToolsDisplay.module.css';
import { EncounterSelector } from './EncounterSelector';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';

type Props = {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    adjustHealth: (system: ShipSystem, relative: boolean, amount: number) => void;
    addEffect: (system: ShipSystem, effect: SystemEffectType) => void;
    addCard: (system: CrewRoleName, cardId: string) => void;
    adjustTimeScale: (timeScale: number) => void;
    serverTimeScale: number;
    encounters: readonly DevEncounterInfo[];
    loadEncounter: (encounterId: string) => void;
    /** In the lobby there are no ships yet, so only the encounter selector is offered. */
    inLobby?: boolean;
};

export const DevToolsDisplay: FC<Props> = (props) => {
    const [system, setSystem] = useState<ShipSystem>('hull');
    const [timeScale, setTimeScale] = useState(props.serverTimeScale);

    const encounterSelector = (
        <EncounterSelector
            encounters={props.encounters}
            loadEncounter={(encounterId) => {
                props.loadEncounter(encounterId);
                props.setOpen(false);
            }}
        />
    );

    const shipTools = (
        <>
            <h3>System</h3>
            <RadioGroup
                value={system}
                setValue={setSystem}
                options={[
                    { id: 'hull', label: 'Hull' },
                    { id: 'reactor', label: 'Reactor' },
                    { id: 'helm', label: 'Helm' },
                    { id: 'science', label: 'Science' },
                    { id: 'tactical', label: 'Tactical' },
                    { id: 'engineer', label: 'Engineer' },
                ]}
            />

            <h3 className={styles.actionHeader}>Action</h3>
            <Tabs
                defaultTabId="health"
                tabs={[
                    { id: 'health', label: 'Damage / Repair', content: (
                        <div className={styles.tabContent}>
                            <Button onClick={() => props.adjustHealth(system, true, -1)}>Deal 1 damage</Button>
                            <Button onClick={() => props.adjustHealth(system, true, 1)}>Repair 1 damage</Button>
                            <Button onClick={() => props.adjustHealth(system, false, 1)}>Set health to 1</Button>
                            <Button onClick={() => props.adjustHealth(system, false, 5)}>Set health to full</Button>
                        </div>
                    ) },
                    { id: 'effects', label: 'Apply Effect', content: (
                        <div className={styles.tabContent}>
                            {Object.keys(systemEffectDefinitions).map(effect => (
                                <Button key={effect} onClick={() => props.addEffect(system, effect as SystemEffectType)}>
                                    {getSystemEffectDefinition(effect as SystemEffectType).name}
                                </Button>
                            ))}
                        </div>
                    ) },
                    { id: 'cards', label: 'Add Card', disabled: system === 'hull' || system === 'reactor', content: (
                        <div className={styles.tabContent}>
                            {Object.keys(cardDefinitions).map(cardId => (
                                <Button key={cardId} onClick={() => props.addCard(system as CrewRoleName, cardId)}>
                                    {getCardDefinition(cardId as CardType).name}
                                </Button>
                            ))}
                        </div>
                    ) },
                ]}
            />
        </>
    );

    return (
        <Dialog
            isOpen={props.isOpen}
            setOpen={props.setOpen}
            title="Dev tools"
            prompt={props.inLobby
                ? 'Load a single encounter to skip the lobby and start the game.'
                : 'These tools let you modify the state of your ship and its systems, or jump to an encounter.'}
            className={styles.root}
        >
            <h3>Time Scale</h3>
            <div className={styles.timeScaleControl}>
                <input
                    type="range"
                    min={minTimeScale}
                    max={maxTimeScale}
                    step="0.05"
                    value={timeScale}
                    onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setTimeScale(value);
                        props.adjustTimeScale(value);
                    }}
                />
                <span>
                    {Math.round(timeScale * 100) / 100}
                    ×
                </span>
            </div>

            {props.inLobby ? encounterSelector : (
                <Tabs
                    defaultTabId="ship"
                    tabs={[
                        { id: 'ship', label: 'Ship', content: shipTools },
                        { id: 'encounters', label: 'Encounters', content: encounterSelector },
                    ]}
                />
            )}
        </Dialog>
    );
};

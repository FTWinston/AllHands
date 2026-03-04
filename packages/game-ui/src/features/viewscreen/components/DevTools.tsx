import { Dialog } from 'common-ui/components/Dialog';
import { RadioGroup } from 'common-ui/components/RadioGroup';
import { Tabs } from 'common-ui/components/Tabs';
import { FC, useState } from 'react';
import styles from './DevTools.module.css';

type Props = {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    addEffect: () => void;
};

export const DevTools: FC<Props> = (props) => {
    const [system, setSystem] = useState('hull');

    return (
        <Dialog
            isOpen={props.isOpen}
            setOpen={props.setOpen}
            title="Dev tools"
            prompt="These tools let you modify the state of your ship and its systems."
            className={styles.root}
        >
            <h3>System</h3>
            <RadioGroup
                value={system}
                setValue={setSystem}
                options={[
                    { id: 'hull', label: 'Hull' },
                    { id: 'reactor', label: 'Reactor' },
                    { id: 'helm', label: 'Helm' },
                    { id: 'sensors', label: 'Sensors' },
                    { id: 'weapons', label: 'Weapons' },
                    { id: 'engineer', label: 'Engineer' },
                ]}
            />

            <h3 className={styles.actionHeader}>Action</h3>
            <Tabs
                defaultTabId="health"
                tabs={[
                    { id: 'health', label: 'Damage / Repair', content: <div>Damage and repair options</div> },
                    { id: 'effects', label: 'Apply Effect', content: <div>Effects content</div> },
                    { id: 'cards', label: 'Add Card', disabled: system === 'hull' || system === 'reactor', content: <div>Cards content</div> },
                ]}
            />
        </Dialog>
    );
};

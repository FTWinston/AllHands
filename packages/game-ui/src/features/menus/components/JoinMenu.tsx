import { ServerAddress } from 'common-data/types/ServerAddress';
import { Button } from 'common-ui/components/Button';
import { Input } from 'common-ui/components/Input';
import { Screen } from 'common-ui/components/Screen';
import { FC, useState } from 'react';

import styles from './JoinMenu.module.css';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

type Props = {
    joinServer: (address: ServerAddress) => void;
    back: () => void;
};

export const JoinMenu: FC<Props> = (props) => {
    const [ipAddress, setIpAddress] = useState('');
    const [port, setPort] = useState(0);

    return (
        <Screen padded>
            <Menu title="Join multi-crew game">
                <MenuItem
                    text="Server address"
                >
                    <Input
                        className={styles.addressInput}
                        placeholder="IP address"
                        type="text"
                        value={ipAddress}
                        onChange={e =>
                            setIpAddress(e.target.value)}
                    />
                    <Input
                        className={styles.portInput}
                        placeholder="Port"
                        type="number"
                        value={port === 0 ? '' : port}
                        onChange={e =>
                            setPort(Number(e.target.value))}
                    />
                </MenuItem>

                <MenuItem
                    text="Go back"
                    onClick={props.back}
                >
                    <div style={{ flexGrow: 1 }} />

                    <Button
                        disabled={!ipAddress || port <= 0}
                        onClick={(e) => {
                            e.preventDefault();
                            props.joinServer({
                                ip: ipAddress,
                                port,
                            });
                        }}
                    >
                        Join
                    </Button>
                </MenuItem>
            </Menu>
        </Screen>
    );
};

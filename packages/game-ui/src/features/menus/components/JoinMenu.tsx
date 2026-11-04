import { ServerAddress } from 'common-data/types/ServerAddress';
import { Button } from 'common-ui/components/Button';
import { Input } from 'common-ui/components/Input';
import { FC, useId, useState } from 'react';

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
    const id = useId();

    return (
        <Menu heading="Join multi-crew game">
            <li>
                <form
                    className={styles.joiningForm}
                    onSubmit={(e) => {
                        e.preventDefault();
                        props.joinServer({
                            ip: ipAddress,
                            port,
                        });
                    }}
                >
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor={`${id}-address`}>Server address</label>
                        <Input
                            id={`${id}-address`}
                            className={styles.addressInput}
                            placeholder="IP address"
                            type="text"
                            value={ipAddress}
                            onChange={e =>
                                setIpAddress(e.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor={`${id}-port`}>Port</label>
                        <Input
                            id={`${id}-port`}
                            className={styles.portInput}
                            placeholder="Port"
                            type="number"
                            value={port === 0 ? '' : port}
                            onChange={e =>
                                setPort(Number(e.target.value))}
                        />
                    </div>
                    <Button
                        className={styles.joinButton}
                        type="submit"
                        disabled={!ipAddress || port <= 0}
                    >
                        Join
                    </Button>
                </form>
            </li>

            <MenuItem
                text="Go back"
                number={2}
                onClick={props.back}
            />
        </Menu>
    );
};

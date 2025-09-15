import { ServerAddress } from 'common-types';
import { Button } from 'common-ui/Button';
import { Input } from 'common-ui/Input';
import { Screen } from 'common-ui/Screen';
import { useState } from 'react';

import styles from './MainMenu.module.css';

type Props = {
    hostSingleCrewServer: () => void;
    hostMultiCrewServer: () => void;
    joinServer: (address: ServerAddress) => void;
    quit: () => void;
};

export const MainMenu: React.FC<Props> = (props) => {
    const [showJoining, setShowJoining] = useState(false);
    const [ipAddress, setIpAddress] = useState('');
    const [port, setPort] = useState(0);

    return (
        <Screen>
            <h1 className={styles.title}>Make It So</h1>
            <nav>
                <ul className={styles.menuList}>
                    <li className={styles.menuItem}>
                        <button
                            className={styles.menuButton}
                            onClick={props.hostSingleCrewServer}
                        >
                            Host single-crew game
                        </button>
                    </li>

                    <li className={styles.menuItem}>
                        <button
                            className={styles.menuButton}
                            onClick={props.hostMultiCrewServer}
                        >
                            Host multi-crew game
                        </button>
                    </li>

                    <li className={styles.menuItem}>
                        <button
                            className={styles.menuButton}
                            onClick={() =>
                                setShowJoining((prevVal) => !prevVal)
                            }
                        >
                            Join multi-crew game
                        </button>

                        {showJoining && (
                            <form className={styles.joiningForm}>
                                <Input
                                    className={styles.addressInput}
                                    placeholder="IP address"
                                    type="text"
                                    value={ipAddress}
                                    onChange={(e) =>
                                        setIpAddress(e.target.value)
                                    }
                                />
                                <Input
                                    className={styles.portInput}
                                    placeholder="Port"
                                    type="number"
                                    value={port === 0 ? '' : port}
                                    onChange={(e) =>
                                        setPort(Number(e.target.value))
                                    }
                                />
                                <Button
                                    label="Join"
                                    type="submit"
                                    disabled={!ipAddress || port <= 0}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        props.joinServer({
                                            ip: ipAddress,
                                            port,
                                        });
                                    }}
                                />
                            </form>
                        )}
                    </li>

                    <li className={styles.menuItem}>
                        <button
                            className={styles.menuButton}
                            onClick={props.quit}
                        >
                            Quit
                        </button>
                    </li>
                </ul>
            </nav>
        </Screen>
    );
};

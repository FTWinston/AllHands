import { Popover } from '@base-ui/react/popover';
import { FC, JSX, PropsWithChildren } from 'react';
import colorPalletes from '../ColorPalette.module.css';
import { ColorPalette } from '../types/ColorPalette';
import { classNames } from '../utils/classNames';
import styles from './InfoPopup.module.css';
import { Popup } from './Popup';

type Props = PropsWithChildren<{
    className?: string;
    name?: string;
    description: JSX.Element;
    palette?: ColorPalette;
    /** Names the button, for content that doesn't say what it is, such as a bar. */
    ariaLabel?: string;
}>;

export const InfoPopup: FC<Props> = props => (
    <Popover.Root>
        <Popover.Trigger
            className={classNames(styles.item, colorPalletes[props.palette ?? 'primary'], props.className)}
            aria-label={props.ariaLabel}
        >
            {props.children}
        </Popover.Trigger>
        <Popup
            name={props.name}
            description={props.description}
        />
    </Popover.Root>
);

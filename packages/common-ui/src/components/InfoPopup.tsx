import { Popover } from '@base-ui-components/react/popover';
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
}>;

export const InfoPopup: FC<Props> = props => (
    <Popover.Root>
        <Popover.Trigger
            className={classNames(styles.item, colorPalletes[props.palette ?? 'primary'], props.className)}
        >
            {props.children}
        </Popover.Trigger>
        <Popup
            name={props.name}
            description={props.description}
        />
    </Popover.Root>
);

import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { FC, JSX, PropsWithChildren } from 'react';
import { classNames } from './classNames';
import styles from './HorizontalScroll.module.css';

export type Props = PropsWithChildren & {
    className?: string;
    contentClassName?: string;
    contentRender?: JSX.Element;
};

export const HorizontalScroll: FC<Props> = props => (
    <ScrollArea.Root className={props.className}>
        <ScrollArea.Viewport className={styles.viewport}>
            <ScrollArea.Content
                className={classNames(styles.content, props.contentClassName)}
                render={props.contentRender}
            >
                {props.children}
            </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className={styles.scrollbar} orientation="horizontal">
            <ScrollArea.Thumb className={styles.thumb} />
        </ScrollArea.Scrollbar>
    </ScrollArea.Root>
);

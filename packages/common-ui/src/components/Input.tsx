import { Input as BaseInput } from '@base-ui-components/react/input';

import { ComponentProps, FC } from 'react';
import { classNames } from '../utils/classNames';
import styles from './Input.module.css';

type Props = ComponentProps<typeof BaseInput> & {
    className?: string;
};

export const Input: FC<Props> = ({ className, ...props }) => (
    <BaseInput
        className={classNames(styles.input, className)}
        {...props}
    />
);

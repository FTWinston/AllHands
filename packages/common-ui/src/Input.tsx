import { Input as BaseInput } from '@base-ui-components/react/input';

import { classNames } from './classNames';
import styles from './Input.module.css';

type Props = React.ComponentProps<typeof BaseInput> & {
    className?: string;
};

export const Input: React.FC<Props> = ({ className, ...props }) => (
    <BaseInput
        className={classNames(styles.input, className)}
        {...props}
    />
);

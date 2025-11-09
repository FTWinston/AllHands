import { FC } from 'react';
import crewStyles from './CrewColors.module.css';
import type { Meta, StoryObj } from '@storybook/react-vite';

type ElementProps = {
    backgroundColor: string;
    textColors: string[];
};

const Element: FC<ElementProps> = props => (
    <tr>
        <td
            style={{
                paddingRight: '1em',
                height: '3em',
                userSelect: 'all',
            }}
        >
            {props.backgroundColor}
        </td>

        <td
            style={{
                padding: '0.75em 1em',
                backgroundColor: `var(${props.backgroundColor})`,
            }}
        >
            <div style={{
                display: 'flex',
                gap: '1em',
            }}
            >
                {props.textColors.map(textColor => (
                    <div
                        style={{
                            color: `var(${textColor})`,
                            userSelect: 'all',
                        }}
                    >
                        {textColor}
                    </div>
                )
                )}
            </div>
        </td>
    </tr>
);

type ElementListProps = {
    className?: string;
};

const ElementList: FC<ElementListProps> = props => (
    <table
        className={props.className}
        style={{ borderCollapse: 'collapse' }}
    >
        <thead>
            <tr>
                <th>Background color</th>
                <th>Allowed text color(s)</th>
            </tr>
        </thead>

        <Element backgroundColor="--grey-darkest" textColors={['--grey-mid', '--grey-light', '--grey-lightest', '--primary-light', '--primary-lightest']} />
        <Element backgroundColor="--grey-dark" textColors={['--grey-light', '--grey-lightest', '--primary-lightest']} />
        <Element backgroundColor="--grey-mid" textColors={['--lightest-contrast-dark']} />
        <Element backgroundColor="--grey-light" textColors={['--grey-darkest', '--lightest-contrast-dark']} />
        <Element backgroundColor="--grey-lightest" textColors={['--grey-darkest', '--grey-dark', '--lightest-contrast-dark']} />

        <Element backgroundColor="--primary-darkest-muted" textColors={['--grey-mid', '--grey-light', '--grey-lightest', '--primary-light', '--primary-lightest']} />
        <Element backgroundColor="--primary-darkest" textColors={['--grey-mid', '--grey-light', '--grey-lightest', '--primary-light', '--primary-lightest']} />
        <Element backgroundColor="--primary-dark" textColors={['--grey-light', '--grey-lightest', '--primary-lightest']} />
        <Element backgroundColor="--primary-mid" textColors={['--grey-lightest']} />
        <Element backgroundColor="--primary-light" textColors={['--lightest-contrast-dark', '--grey-darkest']} />
        <Element backgroundColor="--primary-lightest" textColors={['--lightest-contrast-dark', '--grey-darkest', '--primary-darkest']} />

        <Element backgroundColor="--danger-darkest" textColors={['--grey-mid', '--grey-light', '--grey-lightest', '--danger-light', '--danger-lightest']} />
        <Element backgroundColor="--danger-dark" textColors={['--grey-light', '--grey-lightest', '--danger-lightest']} />
        <Element backgroundColor="--danger-mid" textColors={['--grey-lightest']} />
        <Element backgroundColor="--danger-light" textColors={['--danger-darkest', '--lightest-contrast-dark']} />
        <Element backgroundColor="--danger-lightest" textColors={['--danger-darkest', '--danger-dark', '--lightest-contrast-dark']} />

        <Element backgroundColor="--good-darkest" textColors={['--grey-mid', '--grey-light', '--grey-lightest', '--good-light', '--good-lightest']} />
        <Element backgroundColor="--good-dark" textColors={['--grey-light', '--grey-lightest', '--good-lightest']} />
        <Element backgroundColor="--good-mid" textColors={['--grey-lightest']} />
        <Element backgroundColor="--good-light" textColors={['--good-darkest', '--lightest-contrast-dark']} />
        <Element backgroundColor="--good-lightest" textColors={['--good-darkest', '--good-dark', '--lightest-contrast-dark']} />

        <Element backgroundColor="--energy-darkest" textColors={['--grey-mid', '--grey-light', '--grey-lightest', '--energy-light', '--energy-lightest']} />
        <Element backgroundColor="--energy-dark" textColors={['--grey-light', '--grey-lightest', '--energy-lightest']} />
        <Element backgroundColor="--energy-mid" textColors={['--grey-lightest']} />
        <Element backgroundColor="--energy-light" textColors={['--energy-darkest', '--lightest-contrast-dark']} />
        <Element backgroundColor="--energy-lightest" textColors={['--energy-darkest', '--energy-dark', '--lightest-contrast-dark']} />
    </table>
);

/*
    Fix up the 5 "good" colors, and add a "power" or "contrast" blueish color.
    Then adjust all use of colors (any color-mix or oklch!) to be only variables.
*/

const meta = {
    title: 'common-ui/Colors',
    component: ElementList,
} satisfies Meta<typeof ElementList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};

export const Helm: Story = {
    args: {
        className: crewStyles.helm,
    },
};

export const Tactical: Story = {
    args: {
        className: crewStyles.tactical,
    },
};

export const Sensors: Story = {
    args: {
        className: crewStyles.sensors,
    },
};

export const Engineer: Story = {
    args: {
        className: crewStyles.engineer,
    },
};

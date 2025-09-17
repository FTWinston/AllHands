export function classNames(...classes: (string | null | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

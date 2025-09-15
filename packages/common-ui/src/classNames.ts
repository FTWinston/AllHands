export function classNames(...classes: (string | null | undefined)[]) {
    console.log('classNames', classes);
    console.log('returning ', classes.filter(Boolean).join(' '));

    return classes.filter(Boolean).join(' ');
}

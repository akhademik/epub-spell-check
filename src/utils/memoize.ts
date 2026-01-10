export function memoize<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    let lastArgs: A | null = null;
    let lastResult: R;

    return (...args: A): R => {
        if (lastArgs && args.every((arg, i) => arg === lastArgs![i])) {
            return lastResult;
        }
        lastArgs = args;
        lastResult = fn(...args);
        return lastResult;
    };
}

/**
 * Generates a UUID.
 * @returns The generated UUID.
 * @example
 * uuid() // '8e8679e3-02b1-410b-9399-2c1e5606a971'
 */
export const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(
    /[xy]/g,
    function (c) {
      const r = Math.trunc(Math.random() * 16),
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
};

/**
 * Throttles a function to run at regular intervals AND at the end
 * @param func The function to throttle
 * @param delay The delay in milliseconds
 * @returns The throttled function with trailing execution
 */
export const throttleWithTrailing = <T>(
  func: (...args: T[]) => void,
  delay: number,
) => {
  let lastExecTime = 0;
  let timeoutId: null | ReturnType<typeof setTimeout> = null;
  let lastArgs: null | T[] = null;

  return (...args: T[]) => {
    const now = Date.now();
    lastArgs = args;

    // Execute immediately if enough time has passed
    if (now - lastExecTime >= delay) {
      lastExecTime = now;
      func(...args);

      // Clear any pending trailing execution
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else {
      // Schedule trailing execution if not already scheduled
      timeoutId ??= setTimeout(
        () => {
          if (lastArgs) {
            lastExecTime = Date.now();
            func(...lastArgs);
            timeoutId = null;
            lastArgs = null;
          }
        },
        delay - (now - lastExecTime),
      );
    }
  };
};

/**
 * Debounces a function to run only after it stops being called for a delay period
 * @param func The function to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced function
 */
export const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number,
) => {
  let timeoutId: null | ReturnType<typeof setTimeout> = null;

  return (...args: T) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Schedule new execution
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

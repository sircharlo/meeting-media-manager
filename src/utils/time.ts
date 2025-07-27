import { errorCatcher } from 'src/helpers/error-catcher';
import { pad } from 'src/utils/general';

/**
 * Formats time in seconds to a string in the format of 'hh:mm:ss' or 'mm:ss'
 * @param time The time in seconds
 * @returns The formatted time string
 * @example
 * formatTime(3600) // '1:00:00'
 * formatTime(60) // '01:00'
 * formatTime(0) // '00:00'
 */
export const formatTime = (time?: number | string) => {
  try {
    if (!time) return '00:00';
    if (typeof time === 'string') {
      // If the input is a string, convert it to a number
      time = parseFloat(time);
    }
    if (Number.isNaN(time)) return '00:00';
    if (time < 0) return '00:00'; // Handle negative time gracefully
    if (Number.isNaN(time)) return '..:..';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  } catch (error) {
    errorCatcher(error);
    return '..:..';
  }
};

/**
 * Converts time string to seconds
 * @param time The time string in the format of 'hh:mm:ss' or 'mm:ss'
 * @returns The time in seconds
 * @example
 * timeToSeconds('01:00:00') // 3600
 * timeToSeconds('01:00') // 60
 * timeToSeconds('00:00') // 0
 */
export const timeToSeconds = (time: string) => {
  try {
    const parts = time.split(':').map(parseFloat);
    if (parts.length === 3) {
      // Format: hh:mm:ss
      const [h, m, s] = parts;
      return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
    } else if (parts.length === 2) {
      // Format: mm:ss
      const [m, s] = parts;
      // Convert minutes to hours and calculate seconds
      const h = Math.floor((m || 0) / 60);
      const remainingMinutes = (m || 0) % 60;
      return h * 3600 + remainingMinutes * 60 + (s || 0);
    }
    return 0;
  } catch (error) {
    errorCatcher(error);
    return 0;
  }
};

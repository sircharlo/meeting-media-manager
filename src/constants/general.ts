export const IS_DEV = process.env.NODE_ENV === 'development';
export const SORTER = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

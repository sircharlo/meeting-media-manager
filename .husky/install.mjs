// Skip Husky install in production and CI
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  console.log(
    "Not sure how we got here, but we're skipping Husky install in production or CI...",
  );
  process.exit(1);
}

console.log();
console.log('Importing Husky...');
const husky = (await import('husky')).default;
console.log('Husky is now loaded!');
console.log(husky());

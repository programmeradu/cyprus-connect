import { execSync } from 'child_process';

console.log('🚀 Starting complete database reseed...\n');

const seeds = [
  { name: 'Cleanup & Users', file: 'cleanup-and-reseed.ts' },
  { name: 'Payments & Subscriptions', file: 'seed-payments.ts' },
  { name: 'Emissions & Metrics', file: 'seed-emissions.ts' },
  { name: 'Actions & Credits', file: 'seed-actions-credits.ts' },
];

for (const seed of seeds) {
  console.log(`\n📦 Running: ${seed.name}`);
  console.log('='.repeat(50));
  
  try {
    execSync(`bun run src/db/seeds/${seed.file}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error(`\n❌ Failed to run ${seed.name}`);
    process.exit(1);
  }
}

console.log('\n\n✨ All seeds completed successfully! ✨\n');
console.log('📊 Summary:');
console.log('  - 25 users created (15 Gmail, 10 business)');
console.log('  - ~45 payment transactions (Oct 1 - Nov 28, 2024)');
console.log('  - Historical emissions for Sep-Nov 2024');
console.log('  - Dashboard metrics for all users');
console.log('  - Actions and credits distributed');
console.log('  - Leaderboard populated');
console.log('\n🎉 Database is ready!\n');

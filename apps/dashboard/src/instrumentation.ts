export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureDatabase } = await import('./lib/init-db');
    await ensureDatabase();
  }
}

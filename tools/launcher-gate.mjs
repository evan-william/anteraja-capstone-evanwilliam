export async function waitForLauncher() {
  if (process.platform !== 'win32' || process.env.ANTERAJA_LAUNCHER_GATE !== '1') return;
  await new Promise((resolve, reject) => {
    process.stdin.once('data', resolve);
    process.stdin.once('end', () => reject(new Error('Launcher closed before startup.')));
  });
  process.stdin.pause();
}

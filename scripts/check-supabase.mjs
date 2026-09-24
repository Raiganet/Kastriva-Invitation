import { loadProjectEnv, validateEnvironment } from './env-tools.mjs';
import { probeBackend } from '../lib/readiness.ts';
const mode = process.argv.find(arg => arg.startsWith('--mode='))?.slice(7) || 'development';
const { errors, config } = validateEnvironment(loadProjectEnv({ mode }));
if (errors.length) { errors.forEach(error => console.error('ERROR: ' + error)); process.exitCode = 1; }
else {
  const report = await probeBackend(config);
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('Kastriva Invitation — pemeriksaan koneksi baca-saja');
    for (const check of report.checks) console.log(`[${check.state.toUpperCase()}] ${check.label}: ${check.detail}`);
    console.log(report.readyForAccountTest ? 'Koneksi dasar siap untuk UJI AKUN. Email, isolasi data, dan Storage belum dibuktikan oleh pemeriksaan ini.' : 'Belum siap untuk uji akun. Selesaikan pemeriksaan di atas.');
  }
  process.exitCode = report.readyForAccountTest ? 0 : report.configured ? 1 : 2;
}

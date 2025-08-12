import { spawn } from 'node:child_process';

export type GpuInfo = {
  name: string;
  memoryTotalMB?: number;
  memoryUsedMB?: number;
};

function runCommand(command: string, args: string[], timeoutMs: number = 2000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const to = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      reject(new Error(`Command timeout: ${command} ${args.join(' ')}`));
    }, timeoutMs);

    child.stdout.on('data', (d) => { out += String(d); });
    child.stderr.on('data', (d) => { err += String(d); });

    child.on('error', (e) => {
      clearTimeout(to);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(to);
      if (code === 0) resolve(out.trim());
      else reject(new Error(err.trim() || `Command failed: ${command} (${code})`));
    });
  });
}

export function createGpuService() {
  async function queryNvidia(): Promise<GpuInfo[]> {
    try {
      const q = await runCommand('nvidia-smi', ['--query-gpu=name,memory.total,memory.used', '--format=csv,noheader,nounits'], 2000);
      const lines = q.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      return lines.map((l) => {
        const [name, total, used] = l.split(',').map((x) => x.trim());
        const memoryTotalMB = Number(total);
        const memoryUsedMB = Number(used);
        return { name, memoryTotalMB: Number.isFinite(memoryTotalMB) ? memoryTotalMB : undefined, memoryUsedMB: Number.isFinite(memoryUsedMB) ? memoryUsedMB : undefined };
      });
    } catch {
      return [];
    }
  }

  return {
    async hasGpu(): Promise<boolean> {
      const g = await queryNvidia();
      return g.length > 0;
    },
    async query(): Promise<GpuInfo[]> {
      return queryNvidia();
    },
  };
}

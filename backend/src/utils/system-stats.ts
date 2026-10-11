import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { PrismaClient } from '@prisma/client';

const execAsync = util.promisify(exec);
const prisma = new PrismaClient();

export interface SystemMetrics {
  cpuUsage: number;
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percentUsed: number;
  };
  disk: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percentUsed: number;
  };
  uptimeSeconds: number;
  hostname: string;
  loadAverage: number[];
  services: {
    asterisk: boolean;
    freeswitch: boolean;
    postgres: boolean;
    nginx: boolean;
  };
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const percentMem = Math.round((usedMem / totalMem) * 100);

  // CPU usage calculation
  const cpus = os.cpus();
  let totalTick = 0;
  let totalIdle = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += (cpu.times as any)[type];
    }
    totalIdle += cpu.times.idle;
  }
  const cpuUsage = Math.round(((totalTick - totalIdle) / (totalTick || 1)) * 100);

  // Disk usage via statfs or df
  let disk = {
    totalBytes: 20 * 1024 * 1024 * 1024,
    usedBytes: 5 * 1024 * 1024 * 1024,
    freeBytes: 15 * 1024 * 1024 * 1024,
    percentUsed: 25,
  };

  try {
    const { stdout } = await execAsync("df -B1 / | tail -n1 | awk '{print $2,$3,$4,$5}'");
    const [total, used, free, pcent] = stdout.trim().split(/\s+/);
    if (total && used && free) {
      disk = {
        totalBytes: parseInt(total, 10),
        usedBytes: parseInt(used, 10),
        freeBytes: parseInt(free, 10),
        percentUsed: parseInt(pcent.replace('%', ''), 10),
      };
    }
  } catch (err) {
    // fallback defaults
  }

  // Check Asterisk Telephony Engine health
  let astHealthy = false;
  try {
    const { stdout } = await execAsync('systemctl is-active asterisk 2>/dev/null');
    astHealthy = stdout.trim() === 'active';
  } catch (err) {
    astHealthy = false;
  }

  let pgHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    pgHealthy = true;
  } catch (err) {
    pgHealthy = false;
  }

  let nginxHealthy = false;
  try {
    const { stdout } = await execAsync('systemctl is-active nginx 2>/dev/null');
    nginxHealthy = stdout.trim() === 'active';
  } catch (err) {
    nginxHealthy = false;
  }

  return {
    cpuUsage: Math.min(100, Math.max(1, cpuUsage)),
    memory: {
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem,
      percentUsed: percentMem,
    },
    disk,
    uptimeSeconds: Math.round(os.uptime()),
    hostname: os.hostname(),
    loadAverage: os.loadavg(),
    services: {
      asterisk: astHealthy,
      freeswitch: astHealthy, // backward compatibility alias
      postgres: pgHealthy,
      nginx: nginxHealthy,
    },
  };
}

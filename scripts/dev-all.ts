const processes = [
  Bun.spawn(['bun', 'run', 'dev:server'], {
    stdout: 'inherit',
    stderr: 'inherit',
  }),
  Bun.spawn(['bun', 'run', 'dev'], {
    stdout: 'inherit',
    stderr: 'inherit',
  }),
]

const shutdown = () => {
  for (const process of processes) {
    process.kill()
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await Promise.race(processes.map((process) => process.exited))
shutdown()

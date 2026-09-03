// Added 2026-08-26 after the distributed L7 flood that OOM-crash-looped this app.
// Previously the process ran with no heap ceiling and no memory guard, so a
// traffic spike grew the V8 heap to its ~2GB default limit and the process
// aborted (54 restarts). The heap cap keeps GC honest; max_memory_restart is a
// backstop that recycles the worker cleanly instead of dying on a hard OOM.
module.exports = {
  apps: [
    {
      name: 'tvim-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/tvim-platform/apps/tvim-web',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=1536',
      },
      max_memory_restart: '1800M',
      // Stop PM2 hammering restarts if the app is genuinely broken.
      exp_backoff_restart_delay: 200,
      max_restarts: 20,
    },
  ],
};

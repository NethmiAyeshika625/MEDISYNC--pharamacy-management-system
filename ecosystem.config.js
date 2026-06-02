module.exports = {
  apps: [
    {
      name: 'medisync-api',
      script: './backend/src/index.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      graceful_shutdown: true,
      shutdown_delay: 5000,
      listen_timeout: 10000,
      kill_timeout: 5000,
      ignore_watch: ['node_modules', 'logs'],
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'medisync-web',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 5173',
      cwd: './frontend',
      instances: 1,
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/web-error.log',
      out_file: '../logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      graceful_shutdown: true,
      shutdown_delay: 3000,
      listen_timeout: 5000,
      kill_timeout: 3000
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/medisync.git',
      path: '/var/www/medisync',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};

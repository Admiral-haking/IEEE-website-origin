module.exports = {
  apps: [
    {
      name: 'IEEE-website',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};


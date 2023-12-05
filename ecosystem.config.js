module.exports = {
  apps: [
    {
      name: "birthday-bot",
      script: "./node_modules/ts-node/dist/bin.js",
      args: "./src/index.ts",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

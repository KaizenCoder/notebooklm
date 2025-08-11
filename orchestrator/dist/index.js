import { buildApp } from './app.js';
import { loadEnv } from './env.js';
const env = loadEnv();
const app = buildApp({ env });
app.listen({ port: Number(env.PORT), host: '0.0.0.0' })
    .then(() => {
    app.log.info(`Orchestrator listening on :${env.PORT}`);
})
    .catch((err) => {
    app.log.error({ err }, 'Failed to start server');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
});

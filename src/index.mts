/* c8 ignore start */
import { OpenTelemetryConfigurator, getExpressInstrumentations } from '@myrotvorets/opentelemetry-configurator';
import { initProcessMetrics } from '@myrotvorets/otel-utils';

const configurator = new OpenTelemetryConfigurator({
    serviceName: 'psb-api-videntigraf',
    instrumentations: [...getExpressInstrumentations()],
});

configurator.start();

await initProcessMetrics();

try {
    const { run } = await import('./server.mjs');
    await run();
} catch (e) {
    console.error(e);
}
/* c8 ignore end */

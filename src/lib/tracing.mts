/* c8 ignore start */
import { EventEmitter } from 'node:events';
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

if (+(process.env.ENABLE_TRACING || 0)) {
    const configurator = new OpenTelemetryConfigurator({
        serviceName: 'psb-api-videntigraf',
        instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
    });

    configurator.start();
    EventEmitter.defaultMaxListeners += 5;
}
/* c8 ignore end */

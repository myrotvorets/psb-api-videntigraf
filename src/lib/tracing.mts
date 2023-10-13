/* c8 ignore start */
import { OpenTelemetryConfigurator, getExpressInstrumentations } from '@myrotvorets/opentelemetry-configurator';

const configurator = new OpenTelemetryConfigurator({
    serviceName: 'psb-api-videntigraf',
    instrumentations: [...getExpressInstrumentations()],
});

configurator.start();
/* c8 ignore end */

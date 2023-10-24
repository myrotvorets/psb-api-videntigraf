import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { cleanUploadedFilesMiddleware } from '@myrotvorets/clean-up-after-multer';
import { createServer, getTracer, recordErrorToSpan } from '@myrotvorets/otel-utils';

import { initializeContainer } from './lib/container.mjs';
import { requestDurationMiddleware } from './middleware/duration.mjs';
import { loggerMiddleware } from './middleware/logger.mjs';
import { uploadErrorHandlerMiddleware } from './middleware/upload.mjs';

import { videoController } from './controllers/video.mjs';
import { monitoringController } from './controllers/monitoring.mjs';

export async function configureApp(app: Express): Promise<ReturnType<typeof initializeContainer>> {
    return getTracer().startActiveSpan(
        'configureApp',
        async (span): Promise<ReturnType<typeof initializeContainer>> => {
            try {
                const container = initializeContainer();
                const env = container.resolve('environment');
                const base = dirname(fileURLToPath(import.meta.url));

                app.use(requestDurationMiddleware, loggerMiddleware);
                app.use('/monitoring', monitoringController());

                await installOpenApiValidator(join(base, 'specs', 'videntigraf-private.yaml'), app, env.NODE_ENV, {
                    fileUploader: {
                        dest: tmpdir(),
                        limits: {
                            fieldNameSize: 32,
                            fieldSize: 1024,
                            fields: 16,
                            fileSize: env.VIDENTIGRAF_MAX_FILE_SIZE,
                            files: 1,
                            headerPairs: 16,
                        },
                    },
                });

                app.use(
                    videoController(),
                    notFoundMiddleware,
                    cleanUploadedFilesMiddleware(),
                    uploadErrorHandlerMiddleware,
                    errorMiddleware,
                );

                return container;
            } /* c8 ignore start */ catch (e) {
                recordErrorToSpan(e, span);
                throw e;
            } /* c8 ignore stop */ finally {
                span.end();
            }
        },
    );
}

export function createApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('case sensitive routing', true);
    app.set('x-powered-by', false);
    app.set('trust proxy', true);
    return app;
}

/* c8 ignore start */
export async function run(): Promise<void> {
    const app = createApp();
    const container = await configureApp(app);
    const env = container.resolve('environment');

    const server = await createServer(app);
    server.listen(env.PORT);

    process.on('beforeExit', () => {
        container.dispose().catch((e) => console.error(e));
    });
}
/* c8 ignore end */

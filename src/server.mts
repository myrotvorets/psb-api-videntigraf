import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { cleanUploadedFilesMiddleware } from '@myrotvorets/clean-up-after-multer';
import { createServer, getTracer, recordErrorToSpan } from '@myrotvorets/otel-utils';

import { initializeContainer, scopedContainerMiddleware } from './lib/container.mjs';
import { requestDurationMiddleware } from './middleware/duration.mjs';
import { loggerMiddleware } from './middleware/logger.mjs';
import { uploadErrorHandlerMiddleware } from './middleware/upload.mjs';

import { videoController } from './controllers/video.mjs';
import { monitoringController } from './controllers/monitoring.mjs';

export function configureApp(app: Express): ReturnType<typeof initializeContainer> {
    return getTracer().startActiveSpan('configureApp', (span): ReturnType<typeof initializeContainer> => {
        try {
            const container = initializeContainer();
            const env = container.resolve('environment');
            const base = dirname(fileURLToPath(import.meta.url));

            app.use(requestDurationMiddleware, scopedContainerMiddleware, loggerMiddleware);
            app.use('/monitoring', monitoringController());

            app.use(
                installOpenApiValidator(join(base, 'specs', 'videntigraf-private.yaml'), env.NODE_ENV, {
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
                }),
                videoController(),
                notFoundMiddleware,
                cleanUploadedFilesMiddleware(),
                uploadErrorHandlerMiddleware,
                errorMiddleware(),
            );

            return container;
        } /* c8 ignore start */ catch (e) {
            recordErrorToSpan(e, span);
            throw e;
        } /* c8 ignore stop */ finally {
            span.end();
        }
    });
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
    configureApp(app);
    await createServer(app);
}
/* c8 ignore end */

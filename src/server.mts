import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { cleanUploadedFilesMiddleware } from '@myrotvorets/clean-up-after-multer';
import { createServer } from '@myrotvorets/create-server';
import morgan from 'morgan';

import { environment } from './lib/environment.mjs';

import videoController from './controllers/video.mjs';
import monitoringController from './controllers/monitoring.mjs';
import { uploadErrorHandlerMiddleware } from './middleware/upload.mjs';

export async function configureApp(app: express.Express): Promise<void> {
    const env = environment();

    await installOpenApiValidator(
        join(dirname(fileURLToPath(import.meta.url)), 'specs', 'videntigraf.yaml'),
        app,
        env.NODE_ENV,
        {
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
        },
    );

    app.use(
        videoController(),
        notFoundMiddleware,
        cleanUploadedFilesMiddleware(),
        uploadErrorHandlerMiddleware,
        errorMiddleware,
    );
}

/* istanbul ignore next */
export function setupApp(): express.Express {
    const app = express();
    app.set('strict routing', true);
    app.set('x-powered-by', false);

    app.use(
        morgan(
            '[PSBAPI-videntigraf] :req[X-Request-ID]\t:method\t:url\t:req[content-length]\t:status :res[content-length]\t:date[iso]\t:response-time\t:total-time',
        ),
    );

    return app;
}

/* istanbul ignore next */
export async function run(): Promise<void> {
    const [env, app] = [environment(), setupApp()];

    app.use('/monitoring', monitoringController());

    await configureApp(app);

    const server = await createServer(app);
    server.listen(env.PORT);
}

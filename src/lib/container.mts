import { AwilixContainer, asFunction, asValue, createContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import { type Logger, getLogger } from '@myrotvorets/otel-utils';
import { FaceXVideoClient } from '@myrotvorets/facex';
import { environment } from './environment.mjs';
import { VideoService } from '../services/videoservice.mjs';

export interface Container {
    environment: ReturnType<typeof environment>;
    logger: Logger;
    faceXClient: FaceXVideoClient;
    videoService: VideoService;
}

export interface RequestContainer {
    req: Request;
}

export type LocalsWithContainer = Record<'container', AwilixContainer<RequestContainer & Container>>;

export const container = createContainer<Container>();

/* c8 ignore start */
function createLogger({ req }: Partial<RequestContainer>): Logger {
    const logger = getLogger();
    logger.clearAttributes();
    if (req) {
        if (req.ip) {
            logger.setAttribute('ip', req.ip);
        }

        logger.setAttribute('request', `${req.method} ${req.url}`);
    }

    return logger;
}
/* c8 ignore stop */

function createFaceXVideoClient({ environment }: Container): FaceXVideoClient {
    return new FaceXVideoClient(environment.FACEX_URL, 'facex/node-2.0');
}

function createVideoService({ faceXClient }: Container): VideoService {
    return new VideoService(faceXClient);
}

export function initializeContainer(): typeof container {
    const env = environment(true);
    container.register({
        environment: asValue(env),
        logger: asFunction(createLogger).scoped(),
        faceXClient: asFunction(createFaceXVideoClient).singleton(),
        videoService: asFunction(createVideoService).singleton(),
    });

    container.register('req', asValue(undefined));
    process.on('beforeExit', () => {
        container.dispose().catch((e) => console.error(e));
    });

    return container;
}

export function scopedContainerMiddleware(
    req: Request,
    res: Response<unknown, LocalsWithContainer>,
    next: NextFunction,
): void {
    res.locals.container = container.createScope<RequestContainer>();
    res.locals.container.register({
        req: asValue(req),
    });

    res.on('close', () => {
        void res.locals.container.dispose();
    });

    next();
}

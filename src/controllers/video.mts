import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import { type Request, type RequestHandler, type Response, Router } from 'express';
import { numberParamHandler } from '@myrotvorets/express-microservice-middlewares';
import { faceXErrorHandlerMiddleware } from '../middleware/error.mjs';
import { uploadErrorHandlerMiddleware } from '../middleware/upload.mjs';
import { LocalsWithContainer } from '../lib/container.mjs';

interface UploadResponse {
    success: true;
    guid: string;
}

async function uploadHandler(req: Request, res: Response<UploadResponse, LocalsWithContainer>): Promise<void> {
    const service = res.locals.container.resolve('videoService');
    const guid = await service.upload((req.files as Express.Multer.File[])[0]!);
    res.json({
        success: true,
        guid,
    });
}

interface GuidParams extends Record<string, string | number> {
    guid: string;
}

interface GuidWithArchiveParams extends GuidParams {
    archive: number;
}

type StatusResponse =
    | {
          success: true;
          status: 'inprogress';
      }
    | {
          success: true;
          status: 'complete';
          stats: {
              detections: number;
              matches: number;
              d_archives: number;
              m_archives: number;
          };
      };

async function statusHandler(
    req: Request<GuidParams>,
    res: Response<StatusResponse, LocalsWithContainer>,
): Promise<void> {
    const { guid } = req.params;
    const service = res.locals.container.resolve('videoService');
    const result = await service.status(guid);
    if (false === result) {
        res.json({ success: true, status: 'inprogress' });
    } else {
        res.json({ success: true, status: 'complete', stats: result });
    }
}

function resultHandler(
    what: 'detect' | 'match',
): RequestHandler<GuidWithArchiveParams, Buffer, never, never, LocalsWithContainer> {
    return asyncWrapperMiddleware(
        async (
            req: Request<GuidWithArchiveParams, Buffer, never, never, LocalsWithContainer>,
            res: Response<Buffer, LocalsWithContainer>,
        ): Promise<void> => {
            const { guid, archive } = req.params;
            const service = res.locals.container.resolve('videoService');
            const result = await service.result(guid, what, archive);
            if (!result.length) {
                res.status(204).end();
            } else {
                res.set('Content-Type', 'application/zip');
                res.send(result);
            }
        },
    );
}

export function videoController(): Router {
    const router = Router();
    router.param('archive', numberParamHandler);

    router.post('/process', asyncWrapperMiddleware(uploadHandler));
    router.get('/process/:guid', asyncWrapperMiddleware(statusHandler));
    router.get('/process/:guid/detections/:archive', resultHandler('detect'));
    router.get('/process/:guid/matches/:archive', resultHandler('match'));

    router.use(uploadErrorHandlerMiddleware);
    router.use(faceXErrorHandlerMiddleware);

    return router;
}

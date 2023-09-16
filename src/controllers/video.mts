import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import { FaceXVideoClient } from '@myrotvorets/facex';
import { type Request, type RequestHandler, type Response, Router } from 'express';
import { environment } from '../lib/environment.mjs';
import { faceXErrorHandlerMiddleware } from '../middleware/error.mjs';
import { uploadErrorHandlerMiddleware } from '../middleware/upload.mjs';
import { VideoService } from '../services/video.mjs';

interface UploadResponse {
    success: true;
    guid: string;
}

function uploadHandler(service: VideoService): RequestHandler {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return async (req: Request, res: Response<UploadResponse>): Promise<void> => {
        const guid = await service.upload((req.files as Express.Multer.File[])[0]);
        res.json({
            success: true,
            guid,
        });
    };
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

function statusHandler(service: VideoService): RequestHandler<GuidParams> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return async (req: Request<GuidParams>, res: Response<StatusResponse>): Promise<void> => {
        const { guid } = req.params;
        const result = await service.status(guid);
        if (false === result) {
            res.json({ success: true, status: 'inprogress' });
        } else {
            res.json({ success: true, status: 'complete', stats: result });
        }
    };
}

function resultHandler(service: VideoService, what: 'detect' | 'match'): RequestHandler<GuidWithArchiveParams> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return async (req: Request<GuidWithArchiveParams>, res: Response<Buffer>): Promise<void> => {
        const { guid, archive } = req.params;
        const result = await service.result(guid, what, archive);
        if (!result.length) {
            res.status(204).end();
        } else {
            res.set('Content-Type', 'application/zip');
            res.send(result);
        }
    };
}

export function videoController(): Router {
    const env = environment();

    const router = Router();
    const client = new FaceXVideoClient(env.FACEX_URL, 'facex/node-2.0');
    const service = new VideoService(client);

    router.post('/process', asyncWrapperMiddleware(uploadHandler(service)));
    router.get(
        '/process/:guid([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})',
        asyncWrapperMiddleware(statusHandler(service)),
    );

    router.get(
        '/process/:guid([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/detections/:archive(\\d+)',
        asyncWrapperMiddleware(resultHandler(service, 'detect')),
    );

    router.get(
        '/process/:guid([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/matches/:archive(\\d+)',
        asyncWrapperMiddleware(resultHandler(service, 'match')),
    );

    router.use(uploadErrorHandlerMiddleware);
    router.use(faceXErrorHandlerMiddleware);

    return router;
}

import type { NextFunction, Request, Response } from 'express';
import { ApiError, badGatewayFromError } from '@myrotvorets/express-microservice-middlewares';
import { BadResponseError, FaceXError, HttpError, NetworkError } from '@myrotvorets/facex';
import { UploadError } from '../lib/uploaderror.mjs';
import { BadRequestError } from '../lib/badrequesterror.mjs';

export function faceXErrorHandlerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (err && typeof err === 'object') {
        if (err instanceof UploadError) {
            next(new ApiError(400, 'UPLOAD_FAILED', `${err.message} (${err.file})`, { cause: err }));
            return;
        }

        if (err instanceof HttpError || err instanceof NetworkError || err instanceof BadResponseError) {
            next(badGatewayFromError(err));
            return;
        }

        if (err instanceof BadRequestError) {
            next(new ApiError(400, 'BAD_REQUEST', err.message, { cause: err }));
            return;
        }

        if (err instanceof FaceXError) {
            next(new ApiError(502, 'FACEX_ERROR', err.message, { cause: err }));
            return;
        }
    }

    next(err);
}

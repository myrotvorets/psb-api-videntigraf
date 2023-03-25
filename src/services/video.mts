import { createReadStream } from 'node:fs';
import { FaceXError, FaceXVideoClient, VideoUploadAck } from '@myrotvorets/facex';
import { UploadError } from '../lib/uploaderror.mjs';
import { BadRequestError } from '../lib/badrequesterror.mjs';

export interface ProcessingStats {
    detections: number;
    matches: number;
    d_archives: number;
    m_archives: number;
}

export class VideoService {
    private readonly client: FaceXVideoClient;

    public constructor(client: FaceXVideoClient) {
        this.client = client;
        this.client.timeout = 3_600_000;
    }

    public async upload(file: Express.Multer.File): Promise<string> {
        const response = await this.client.uploadVideo(file.path ? createReadStream(file.path) : file.buffer);
        if (response instanceof VideoUploadAck && !response.isError()) {
            return response.serverRequestID;
        }

        throw new UploadError(response.comment, file.originalname);
    }

    public async status(guid: string): Promise<ProcessingStats | false> {
        const response = await this.client.getVideoStatus(guid);
        if (response.isError()) {
            throw new FaceXError(response.comment);
        }

        if (!response.isCompleted()) {
            return false;
        }

        const attrs = response.attributes();
        return {
            detections: +attrs.d || 0,
            matches: +attrs.m || 0,
            d_archives: +attrs.d_arx || 0,
            m_archives: +attrs.m_arx || 0,
        };
    }

    public async result(guid: string, type: 'match' | 'detect', n: number): Promise<Buffer> {
        // Workaround for the FaceX bug: it throws a System.NullReferenceException
        // if we are requesting an archive that does not exist
        const stats = await this.status(guid);
        if (false === stats) {
            throw new BadRequestError('The result is not ready yet');
        }

        const key = `${type[0]}_archives` as 'd_archives' | 'm_archives';
        const nArchives = stats[key];
        if (n < 1 || n > nArchives) {
            throw new BadRequestError(`Invalid archive number: ${n}`);
        }

        const response = await this.client.getVideoResult(guid, type, n);
        if (response.isError()) {
            throw new FaceXError(response.comment);
        }

        return response.archive ? response.archive.archiveAsBuffer : Buffer.from('');
    }
}

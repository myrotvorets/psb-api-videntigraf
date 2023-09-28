/* eslint-disable class-methods-use-this */
import {
    FaceXVideoClient,
    type VideoResult,
    type VideoResultType,
    type VideoStatus,
    type VideoType,
    type VideoUploadAck,
    type VideoUploadPriority,
} from '@myrotvorets/facex';
import { func } from 'testdouble';

export const uploadVideo = func<typeof FaceXVideoClient.prototype.uploadVideo>();
export const getVideoStatus = func<typeof FaceXVideoClient.prototype.getVideoStatus>();
export const getVideoResult = func<typeof FaceXVideoClient.prototype.getVideoResult>();

export class FakeFaceXVideoClient extends FaceXVideoClient {
    public uploadVideo(video: VideoType, priority?: VideoUploadPriority): Promise<VideoUploadAck> {
        return uploadVideo(video, priority);
    }

    public getVideoStatus(guid: string): Promise<VideoStatus> {
        return getVideoStatus(guid);
    }

    public getVideoResult(guid: string, type: VideoResultType, archiveNumber?: number): Promise<VideoResult> {
        return getVideoResult(guid, type, archiveNumber);
    }
}

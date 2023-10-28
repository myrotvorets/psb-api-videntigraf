import { mock } from 'node:test';
import {
    FaceXVideoClient,
    type VideoResult,
    type VideoResultType,
    type VideoStatus,
    type VideoType,
    type VideoUploadAck,
    type VideoUploadPriority,
} from '@myrotvorets/facex';

export const uploadVideoMock = mock.fn<typeof FaceXVideoClient.prototype.uploadVideo>();
export const getVideoStatusMock = mock.fn<typeof FaceXVideoClient.prototype.getVideoStatus>();
export const getVideoResultMock = mock.fn<typeof FaceXVideoClient.prototype.getVideoResult>();

export class FakeFaceXVideoClient extends FaceXVideoClient {
    public override uploadVideo(video: VideoType, priority?: VideoUploadPriority): Promise<VideoUploadAck> {
        return uploadVideoMock(video, priority);
    }

    public override getVideoStatus(guid: string): Promise<VideoStatus> {
        return getVideoStatusMock(guid);
    }

    public override getVideoResult(guid: string, type: VideoResultType, archiveNumber?: number): Promise<VideoResult> {
        return getVideoResultMock(guid, type, archiveNumber);
    }
}

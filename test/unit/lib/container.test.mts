import { expect } from 'chai';
import { FaceXVideoClient } from '@myrotvorets/facex';
import { container, initializeContainer } from '../../../src/lib/container.mjs';
import { VideoService } from '../../../src/services/videoservice.mjs';

describe('Container', function () {
    beforeEach(function () {
        return container.dispose();
    });

    describe('initializeContainer', function () {
        it('should initialize the container', function () {
            const container = initializeContainer();

            expect(container.resolve('faceXClient')).to.be.an('object').that.is.instanceOf(FaceXVideoClient);
            expect(container.resolve('videoService')).to.be.an('object').that.is.instanceOf(VideoService);

            expect(container.resolve('environment'))
                .to.be.an('object')
                .that.has.property('NODE_ENV')
                .that.is.a('string');
        });
    });
});

import 'mocha';
import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

const env = { ...process.env };
process.env = {
    NODE_ENV: 'test',
    OTEL_SDK_DISABLED: 'true',
    FACEX_URL: 'http://example.invalid/',
};

/** @type {import('mocha').RootHookObject} */
export const mochaHooks = {
    afterAll() {
        process.env = { ...env };
    },
};

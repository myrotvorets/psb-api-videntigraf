FROM myrotvorets/node-build:latest@sha256:1619f1f41a0ec5e05f56d15d894e7936e055d4327601a424ad92661e25d0daf4 AS build
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service && apk add --no-cache vips-dev
USER nobody:nobody
COPY --chown=nobody:nobody ./package.json ./package-lock.json ./tsconfig.json .npmrc* ./
RUN \
    npm r --package-lock-only \
        @myrotvorets/eslint-config-myrotvorets-ts eslint-formatter-gha \
        @types/jest jest ts-jest jest-sonar-reporter jest-github-actions-reporter \
        supertest @types/supertest \
        ts-node \
        nodemon && \
    npm ci --ignore-scripts --userconfig .npmrc.local && \
    rm -f .npmrc.local && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false
RUN npm prune --omit=dev

FROM myrotvorets/node-min@sha256:1cdf94d901bdc09a3680632e86ab07a2408407b0ed0102eab92dd3b05ea5d348
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service && apk add --no-cache vips vips-cpp
COPY healthcheck.sh /usr/local/bin/
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 CMD ["/usr/local/bin/healthcheck.sh"]
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules

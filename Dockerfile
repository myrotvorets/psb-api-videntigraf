FROM myrotvorets/node-build:latest@sha256:936b64c60d101c4f3aaaf1b85d29b28676e2a8b1318809edc80889bfe1f98996 AS build
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service && apk add --no-cache vips-dev
USER nobody:nobody
COPY --chown=nobody:nobody ./package.json ./package-lock.json ./tsconfig.json .npmrc* ./
RUN \
    npm ci --ignore-scripts --userconfig .npmrc.local && \
    rm -f .npmrc.local && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false
RUN npm prune --omit=dev

FROM myrotvorets/node-min@sha256:42e0cc626d26b1721c5bc93ee2345b0aa2ed94dd72af96945e671651b7e7a5c3
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service && apk add --no-cache vips vips-cpp
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody ./package.json ./

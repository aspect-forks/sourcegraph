FROM sourcegraph/alpine-3.14:200740_2023-02-22_a1b4fb9100c1@sha256:a5b6731db64e742e1e11d31df443d60f756d892bc90d4581c5ddbfe4259d1302

ARG COMMIT_SHA="unknown"
ARG DATE="unknown"
ARG VERSION="unknown"

LABEL org.opencontainers.image.revision=${COMMIT_SHA}
LABEL org.opencontainers.image.created=${DATE}
LABEL org.opencontainers.image.version=${VERSION}
LABEL com.sourcegraph.github.url=https://github.com/sourcegraph/sourcegraph/commit/${COMMIT_SHA}

USER sourcegraph
ENTRYPOINT ["/usr/local/bin/sg"]
COPY sg /usr/local/bin/

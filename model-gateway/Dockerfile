# Model gateway with whisper.cpp baked in.
#
# Build args:
#   WHISPER_CPP_VERSION  git tag of ggerganov/whisper.cpp (default v1.7.4)
#   WHISPER_MODEL        ggml model to download (default base.en; use "small"
#                        or "medium" for better accuracy / more languages)
#
# The model is downloaded at build time so the image is self-contained —
# suitable for the "audio never leaves your infrastructure" deployment story.

FROM debian:bookworm-slim AS whisper-build
RUN apt-get update && apt-get install -y --no-install-recommends \
      git cmake g++ make ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

ARG WHISPER_CPP_VERSION=v1.7.4
RUN git clone --depth 1 --branch ${WHISPER_CPP_VERSION} \
      https://github.com/ggerganov/whisper.cpp /whisper
WORKDIR /whisper
# Static build so we can copy a single self-contained binary.
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF \
    && cmake --build build -j"$(nproc)" --target whisper-cli

ARG WHISPER_MODEL=base.en
RUN bash ./models/download-ggml-model.sh ${WHISPER_MODEL} \
    && mv models/ggml-${WHISPER_MODEL}.bin /whisper/model.bin

FROM node:20-bookworm-slim
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app
COPY --from=whisper-build /whisper/build/bin/whisper-cli /usr/local/bin/whisper-cli
COPY --from=whisper-build /whisper/model.bin /models/model.bin
COPY . /app/model-gateway

ENV WHISPER_BACKEND=whispercpp \
    WHISPER_CPP_BIN=/usr/local/bin/whisper-cli \
    WHISPER_CPP_MODEL=/models/model.bin \
    MODEL_GATEWAY_PORT=4011

USER app
EXPOSE 4011
CMD ["node", "/app/model-gateway/server.js"]

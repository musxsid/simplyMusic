# Multi-stage Dockerfile for Rust Processing Service

# ---------------------------------------------------
# Stage 1: Build binary using latest Rust
# ---------------------------------------------------
FROM rust:latest as builder

WORKDIR /usr/src/processing-service

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies layer
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/processing_service*

# Copy actual source code and build final binary
COPY src ./src
RUN cargo build --release

# ---------------------------------------------------
# Stage 2: Runtime image using trixie-slim for glibc compatibility
# ---------------------------------------------------
FROM debian:trixie-slim as runtime

WORKDIR /app

# Install SSL certificates and runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root system user
RUN useradd -m -u 10001 -s /bin/bash appuser

# Copy binary from builder
COPY --from=builder /usr/src/processing-service/target/release/processing-service /app/processing-service

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8084

ENV RUST_LOG=info

CMD ["/app/processing-service"]

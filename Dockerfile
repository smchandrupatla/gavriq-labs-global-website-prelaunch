# Local preview container for gavriqlabsglobal.com.
#
# This is local-only tooling for previewing changes before you push to
# GitHub/Cloudflare. It has no connection to the actual deployment
# pipeline: Cloudflare's Workers Build runs `npx wrangler deploy`
# directly from the repo (see README) and never looks at this file, and
# this Dockerfile itself is excluded from the deployed static assets via
# .assetsignore, so it never ships to the live site either way. Building
# or running this image cannot affect, trigger, or block a Cloudflare
# deployment.
#
# Runs the site through the same engine Cloudflare uses in production
# (Wrangler's local Workers runtime), so what you see here — clean URLs,
# security headers from _headers, the branded 404, and the /api/contact
# Worker logic — matches what actually deploys, rather than a generic
# static file server that could quietly drift out of sync with prod.
#
# Build:  docker build -t gavriq-labs-preview .
# Run:    docker run --rm -p 8888:8787 gavriq-labs-preview
# Then open http://localhost:8888
# (Host port 8888 is arbitrary — pick any free port on your machine and
# change the number before the colon; the container always listens on
# 8787 internally.)
#
# To test the contact form's real email send (optional — without this
# it still works, just responds with a graceful "temporarily
# unavailable" message, same as production without the secret set):
#   docker run --rm -p 8888:8787 -e RESEND_API_KEY=your_key gavriq-labs-preview

# Debian-based (glibc), not Alpine: Cloudflare's workerd binary — the
# actual runtime `wrangler dev` shells out to — ships as a glibc build
# and does not run on musl libc, so Alpine fails at container start
# with "spawn .../workerd ENOENT" despite installing cleanly.
FROM node:22-slim

WORKDIR /app

# Install the exact Wrangler version this project has been validated
# against this session, so the preview doesn't shift under you.
# (Node 22+ is required — wrangler's own dependencies, e.g.
# @cloudflare/kv-asset-handler and miniflare, declare it as a minimum.)
RUN npm install -g wrangler@4.129.1

# Copy only what the site needs to run. .dockerignore keeps out .git,
# node_modules, local caches, docs and CI-only files.
COPY . .

EXPOSE 8787

ENV WRANGLER_DISABLE_UPDATE_CHECK=1

# --persist-to moves wrangler's own runtime state outside the watched
# assets directory (it defaults to .wrangler/state, which sits *inside*
# the assets tree here — wrangler's own writes there would otherwise
# retrigger its file-watcher in an endless reload loop that starves
# real requests). --live-reload=false because nothing changes inside
# this container after it's built, so there's nothing to watch for.
CMD ["wrangler", "dev", "--ip", "0.0.0.0", "--port", "8787", "--persist-to", "/tmp/wrangler-state", "--live-reload=false"]

FROM caddy:2.10-alpine

# A restrictive umask on the VM can make a bind-mounted Caddyfile unreadable
# to Caddy. Bake the public routing config into the image with a stable mode.
COPY --chmod=644 Caddyfile /etc/caddy/Caddyfile

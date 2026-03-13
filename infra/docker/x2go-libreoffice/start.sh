#!/bin/bash
set -e

# Generate SSH host keys if missing
ssh-keygen -A

# Start x2go database
x2godbadmin --createdb 2>/dev/null || true

# Initial Nextcloud sync + background periodic sync
if [ -n "$NEXTCLOUD_USER" ] && [ -n "$NEXTCLOUD_PASSWORD" ]; then
  NC_LOCAL="/home/user/Nextcloud"
  NC_REMOTE="http://nextcloud"

  # Initial sync
  nextcloudcmd --non-interactive -u "$NEXTCLOUD_USER" -p "$NEXTCLOUD_PASSWORD" \
    "$NC_LOCAL" "$NC_REMOTE" && \
    echo "Nextcloud initial sync OK" || \
    echo "WARNING: Nextcloud initial sync failed"
  chown -R user:user "$NC_LOCAL"

  # Background sync every 60s
  (while true; do
    sleep 60
    nextcloudcmd --non-interactive --silent -u "$NEXTCLOUD_USER" -p "$NEXTCLOUD_PASSWORD" \
      "$NC_LOCAL" "$NC_REMOTE" 2>/dev/null
    chown -R user:user "$NC_LOCAL" 2>/dev/null
  done) &
fi

# Launch supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

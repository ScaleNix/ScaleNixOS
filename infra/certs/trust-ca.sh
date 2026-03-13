#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# ScalenixOS — Trust Root CA for all browsers
# Usage: sudo bash trust-ca.sh
# ─────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CA_CERT="$SCRIPT_DIR/scalenix-ca.crt"

if [ ! -f "$CA_CERT" ]; then
  echo "ERROR: CA certificate not found at $CA_CERT"
  exit 1
fi

echo "=== ScalenixOS Root CA Trust Installer ==="
echo ""

# ─── 1. System-wide trust (Chrome, Chromium, Edge, Brave, Opera) ───
echo "[1/3] Installing CA into system trust store..."
if command -v update-ca-certificates &>/dev/null; then
  # Debian / Ubuntu
  cp "$CA_CERT" /usr/local/share/ca-certificates/scalenix-ca.crt
  update-ca-certificates
  echo "  -> System trust store updated (Debian/Ubuntu)"
elif command -v update-ca-trust &>/dev/null; then
  # RHEL / Fedora / CentOS
  cp "$CA_CERT" /etc/pki/ca-trust/source/anchors/scalenix-ca.crt
  update-ca-trust extract
  echo "  -> System trust store updated (RHEL/Fedora)"
elif command -v trust &>/dev/null; then
  # Arch Linux
  trust anchor --store "$CA_CERT"
  echo "  -> System trust store updated (Arch)"
else
  echo "  -> WARNING: Unknown distro, manually add $CA_CERT to your system CA store"
fi

# ─── 2. Firefox (uses its own NSS database, not system store) ──────
echo ""
echo "[2/3] Installing CA into Firefox NSS databases..."
if command -v certutil &>/dev/null; then
  FOUND=0
  # Find all Firefox/Thunderbird NSS databases for all users
  for nssdb in $(find /home -maxdepth 5 -name "cert9.db" 2>/dev/null) \
               $(find /root -maxdepth 5 -name "cert9.db" 2>/dev/null); do
    DBDIR="$(dirname "$nssdb")"
    certutil -A -n "Scalenix Root CA" -t "CT,C,C" -i "$CA_CERT" -d "sql:$DBDIR" 2>/dev/null && {
      echo "  -> Added to: $DBDIR"
      FOUND=$((FOUND + 1))
    }
  done
  # Also handle legacy cert8.db
  for nssdb in $(find /home -maxdepth 5 -name "cert8.db" 2>/dev/null); do
    DBDIR="$(dirname "$nssdb")"
    certutil -A -n "Scalenix Root CA" -t "CT,C,C" -i "$CA_CERT" -d "dbm:$DBDIR" 2>/dev/null && {
      echo "  -> Added to (legacy): $DBDIR"
      FOUND=$((FOUND + 1))
    }
  done
  if [ "$FOUND" -eq 0 ]; then
    echo "  -> No Firefox profiles found (start Firefox once first)"
  fi
else
  echo "  -> certutil not found. Install with: sudo apt install libnss3-tools"
  echo "     Then re-run this script to add the CA to Firefox."
fi

# ─── 3. Snap Firefox (separate profile location) ──────────────────
echo ""
echo "[3/3] Installing CA into Snap Firefox profiles..."
if command -v certutil &>/dev/null; then
  FOUND=0
  for nssdb in $(find /home -path "*/snap/firefox/common/.mozilla/firefox/*/cert9.db" 2>/dev/null); do
    DBDIR="$(dirname "$nssdb")"
    certutil -A -n "Scalenix Root CA" -t "CT,C,C" -i "$CA_CERT" -d "sql:$DBDIR" 2>/dev/null && {
      echo "  -> Added to: $DBDIR"
      FOUND=$((FOUND + 1))
    }
  done
  if [ "$FOUND" -eq 0 ]; then
    echo "  -> No Snap Firefox profiles found"
  fi
fi

echo ""
echo "=== Done ==="
echo ""
echo "Browsers that now trust Scalenix Root CA:"
echo "  - Chrome / Chromium / Brave / Edge / Opera (via system store)"
echo "  - Firefox / Thunderbird (via NSS certutil)"
echo "  - curl / wget / Node.js (via system store)"
echo ""
echo "NOTE: Restart any open browsers for changes to take effect."
echo ""
echo "To verify:  curl https://os.scalenix.fr  (should work without -k)"

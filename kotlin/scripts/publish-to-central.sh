#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROPS_FILE="$ROOT/gradle.properties"

read_prop() {
  local key="$1"
  local default="${2:-}"
  if [[ ! -f "$PROPS_FILE" ]]; then
    echo "$default"
    return
  fi
  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$PROPS_FILE" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    echo "$default"
    return
  fi
  echo "${line#*=}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

USERNAME="${CENTRAL_PORTAL_USERNAME:-$(read_prop centralPortalUsername)}"
PASSWORD="${CENTRAL_PORTAL_PASSWORD:-$(read_prop centralPortalPassword)}"
NAMESPACE="${CENTRAL_PORTAL_NAMESPACE:-$(read_prop centralPortalNamespace io.github.scan-kenteken)}"

if [[ -z "$USERNAME" || -z "$PASSWORD" ]]; then
  echo "error: set centralPortalUsername and centralPortalPassword in kotlin/gradle.properties" >&2
  echo "       or export CENTRAL_PORTAL_USERNAME and CENTRAL_PORTAL_PASSWORD" >&2
  exit 1
fi

GRADLE="./gradlew"
if [[ ! -x "$GRADLE" ]]; then
  GRADLE="gradle"
fi

echo "Running tests..."
$GRADLE test

echo "Publishing to Central Portal staging API..."
$GRADLE publish -PpublishToMavenCentral=true

AUTH="$(printf '%s:%s' "$USERNAME" "$PASSWORD" | base64 -w0 2>/dev/null || printf '%s:%s' "$USERNAME" "$PASSWORD" | base64)"

echo "Sending deployment to Central Publisher Portal (namespace: $NAMESPACE)..."
UPLOAD_RESPONSE="$(mktemp)"
UPLOAD_STATUS="$(curl --fail-with-body -sS -o "$UPLOAD_RESPONSE" -w '%{http_code}' -X POST \
  "https://ossrh-staging-api.central.sonatype.com/manual/upload/defaultRepository/${NAMESPACE}" \
  -H "Authorization: Bearer ${AUTH}")" || true

if [[ "$UPLOAD_STATUS" != "200" && "$UPLOAD_STATUS" != "201" && "$UPLOAD_STATUS" != "204" ]]; then
  echo "error: Portal upload failed (HTTP ${UPLOAD_STATUS})" >&2
  cat "$UPLOAD_RESPONSE" >&2 || true
  echo >&2
  echo "If Gradle publish failed with HTTP 400, check that your namespace is registered at:" >&2
  echo "https://central.sonatype.com/publishing/namespaces" >&2
  rm -f "$UPLOAD_RESPONSE"
  exit 1
fi

rm -f "$UPLOAD_RESPONSE"

echo ""
echo "Done. Open https://central.sonatype.com/publishing to validate and publish."

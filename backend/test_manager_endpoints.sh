#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Refreshing database and seeding TestSeeder..."
php artisan migrate:fresh --seed --seeder=TestSeeder

echo "Logging in as manager to obtain token..."
LOGIN_RESP=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"manager@example.com","password":"password123"}' http://127.0.0.1:8000/api/v1/auth/login)
TOKEN=$(php -r 'echo json_decode(stream_get_contents(STDIN), true)["token"] ?? "";' <<< "$LOGIN_RESP")
if [ -z "$TOKEN" ]; then
  echo "Failed to obtain token. Login response:" >&2
  echo "$LOGIN_RESP" >&2
  exit 2
fi
echo "Token obtained. Running endpoint checks..."

check() {
  method=$1; url=$2; data=${3:-}
  if [ -n "$data" ]; then
    resp=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X "$method" -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$url")
  else
    resp=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -H "Accept: application/json" -H "Authorization: Bearer $TOKEN" "$url")
  fi
  status=$(echo "$resp" | awk -F"HTTP_STATUS:" '{print $2}' | tr -d '\r' | tail -n1)
  body=$(echo "$resp" | sed -e 's/\nHTTP_STATUS:.*//g')
  echo "-> $method $url -> HTTP $status"
  if [ "$status" -ge 400 ]; then
    echo "Response body:" >&2
    echo "$body" >&2
    exit 3
  fi
  echo "$body"
}

# GET hotel
check GET http://127.0.0.1:8000/api/v1/manager/hotel

# PATCH hotel
check PATCH http://127.0.0.1:8000/api/v1/manager/hotel '{"name":"Shell Updated Hotel"}'

# GET receptionists (should be empty after fresh seed)
check GET http://127.0.0.1:8000/api/v1/manager/receptionists

# Create receptionist
create_resp=$(check POST http://127.0.0.1:8000/api/v1/manager/receptionists '{"first_name":"Shell","last_name":"Rec","email":"shell.rec@example.com","phone":"999888777","password":"secret123"}')

# Extract receptionist id
recv_id=$(php -r 'echo json_decode(stream_get_contents(STDIN), true)["data"]["receptionist_id"] ?? "";' <<< "$create_resp")
if [ -z "$recv_id" ]; then
  echo "Failed to obtain created receptionist id" >&2
  exit 4
fi

# Show receptionist
check GET http://127.0.0.1:8000/api/v1/manager/receptionists/$recv_id

echo "All manager endpoint checks passed."

#!/bin/bash

# ==========================================
# AUTOMATED DEPLOYMENT & CLOUDFLARE CACHE PURGE
# ==========================================

# 1. Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found in the current directory."
  exit 1
fi

# 2. Check for Cloudflare configuration
if [ -z "$CF_ZONE_ID" ] || [ -z "$CF_API_TOKEN" ]; then
  echo "Error: CF_ZONE_ID or CF_API_TOKEN is missing in the .env file."
  exit 1
fi

echo "Starting deployment process..."
echo "---------------------------------"

# 3. Build and Restart Docker
echo "Building and restarting Docker containers..."
docker compose up -d --build

# Check the exit status of the Docker command ($? = 0 means success)
if [ $? -eq 0 ]; then
  echo "Docker deployment successful."
  echo "---------------------------------"
  
  # 4. Call Cloudflare API to purge cache
  echo "Sending cache purge request to Cloudflare..."
  
  RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
       -H "Authorization: Bearer $CF_API_TOKEN" \
       -H "Content-Type: application/json" \
       --data '{"purge_everything":true}')

  # 5. Parse the response
  if echo "$RESPONSE" | grep -qE '"success":\s*true'; then
      echo "SUCCESS: Cloudflare cache purged successfully."
      echo "Your website has been updated to the latest version."
  else
      echo "WARNING: Docker deployed successfully, but Cloudflare cache purge failed."
      echo "Cloudflare error details:"
      echo "$RESPONSE"
  fi

else
  echo "FAILURE: Docker build failed. Cache purge aborted."
  exit 1
fi
#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
APP_NAME=$1
SOURCE_DIR="./dist" # Assumes script is run from the app's directory

# Validate input
if [ -z "$APP_NAME" ]; then
    echo "Error: Application name argument is required." >&2
    exit 1
fi

# Load environment variables from the root .env file (relative to app dir)
ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Error: Root .env file not found at $ENV_FILE" >&2
    exit 1
fi

# Check if required variables are set
if [ -z "$S3_BUCKET_NAME" ] || [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "Error: S3_BUCKET_NAME and CLOUDFRONT_DISTRIBUTION_ID must be set in the .env file." >&2
    exit 1
fi

echo "--- Deploying $APP_NAME ---"
echo "Using S3 Bucket: $S3_BUCKET_NAME"
echo "Using CloudFront ID: $CLOUDFRONT_DISTRIBUTION_ID"

# --- Determine Paths ---
if [ "$APP_NAME" == "root-app" ]; then
    S3_DEST_PATH="s3://$S3_BUCKET_NAME/"
    INVALIDATION_PATH="/*"
else
    S3_DEST_PATH="s3://$S3_BUCKET_NAME/$APP_NAME/"
    INVALIDATION_PATH="/$APP_NAME/*"
fi

# --- Build Step ---
echo "Building $APP_NAME..."
pnpm build

# --- Sync to S3 ---
echo "Syncing $SOURCE_DIR to $S3_DEST_PATH..."
if [ "$APP_NAME" == "root-app" ]; then
    # For the root app, sync without --delete to avoid removing sub-app directories
    aws s3 sync "$SOURCE_DIR" "$S3_DEST_PATH"
else
    # For sub-apps, use --delete to clean up old files within their specific prefix
    aws s3 sync "$SOURCE_DIR" "$S3_DEST_PATH" --delete
fi

# --- Invalidate CloudFront ---
echo "Creating CloudFront invalidation for path: $INVALIDATION_PATH..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "$INVALIDATION_PATH"

echo "--- Deployment of $APP_NAME completed successfully. ---"

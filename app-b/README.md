# SPA Application (React + TypeScript + Vite)

This directory contains the frontend single-page application built with React, TypeScript, and Vite.

## Available Scripts

In the project directory, you can run:

### `pnpm install`

Installs the necessary dependencies.

### `pnpm dev`

Runs the app in development mode.\
Open [http://localhost:5173](http://localhost:5173) (or the port shown in the terminal) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `pnpm build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

### `pnpm lint`

Runs the ESLint linter to check for code style issues.

### `pnpm deploy`

Builds the application and deploys it to the configured AWS S3 bucket. It also creates a CloudFront invalidation to ensure the latest version is served.

**Environment Variables Required for Deployment:**

Before running `pnpm deploy`, ensure the following environment variables are set:

- `S3_BUCKET_NAME`: The name of the AWS S3 bucket where the built application files will be uploaded.
- `CLOUDFRONT_DISTRIBUTION_ID`: The ID of the AWS CloudFront distribution that serves the application.

These values are typically obtained from the Terraform output after provisioning the infrastructure (see the root [README.md](../README.md)).

Example:

```bash
export S3_BUCKET_NAME="your-s3-bucket-name"
export CLOUDFRONT_DISTRIBUTION_ID="YOUR_CLOUDFRONT_ID"
pnpm deploy
```

Or using Terraform outputs directly:

```bash
export S3_BUCKET_NAME=$(terraform -chdir=../terraform output -raw s3_bucket_name)
export CLOUDFRONT_DISTRIBUTION_ID=$(terraform -chdir=../terraform output -raw cloudfront_distribution_id)
pnpm deploy
```

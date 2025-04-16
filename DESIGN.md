# Design Document: React SPA Deployment to AWS S3 + CloudFront

## What: Project Goal

This project aims to deploy multiple independent React Single Page Applications (SPAs) developed with Vite and TypeScript into a single AWS S3 bucket. These applications are served under distinct path prefixes (e.g., `/app-a/`, `/app-b/`) from the same domain name.

The infrastructure utilizes:

- **AWS S3:** For hosting the static build artifacts of all SPAs.
- **AWS CloudFront:** As a Content Delivery Network (CDN) to serve the applications globally with low latency and handle SSL termination.
- **CloudFront Function:** To rewrite request paths, ensuring that client-side routing within each SPA works correctly when accessed via its prefix.
- **AWS Certificate Manager (ACM):** To manage the SSL/TLS certificate for the custom domain.
- **Terraform:** To provision and manage all the AWS infrastructure as code (IaC).
- **Cloudflare:** For DNS management of the custom domain.

One application (`root-app`) is deployed to the root (`/`) and can serve as a landing or index page linking to the other applications.

## Why: Motivations

- **Cost Efficiency:** Hosting multiple applications in a single S3 bucket and serving them through one CloudFront distribution is generally more cost-effective than provisioning separate resources for each application.
- **Simplified Infrastructure Management:** Managing a single set of core infrastructure components (bucket, distribution) is simpler than managing multiple sets.
- **Shared Domain:** Allows multiple related applications or micro-frontends to reside under a single, unified domain name.
- **Demonstration:** Provides a practical example of using CloudFront Functions for path rewriting in a multi-SPA context.

## How: Implementation Details

### 1. S3 Bucket Structure

The S3 bucket is structured to host each application under its corresponding prefix:

```text
s3://your-bucket-name/
├── app-a/
│   ├── index.html
│   └── assets/
│       └── ...
├── app-b/
│   ├── index.html
│   └── assets/
│       └── ...
├── app-c/
│   ├── index.html
│   └── assets/
│       └── ...
├── index.html  # root-app (root)
└── assets/     # root-app assets
    └── ...
```

### 2. CloudFront Distribution & Function

- The CloudFront distribution is configured with the S3 bucket as its origin.
- A CloudFront Function is attached to the `viewer-request` event.

- **Function Logic:**
  - It inspects the incoming request URI.
  - If the URI matches a known application prefix (e.g., `/app-a/`, `/app-b/`) and does _not_ contain a file extension (indicating it's likely a client-side route), it rewrites the URI to the `index.html` file within that application's prefix directory (e.g., `/app-a/index.html`).
  - This ensures that refreshing the browser on a client-side route (e.g., `/app-a/some/route`) correctly serves the application's entry point (`/app-a/index.html`), allowing the SPA's router to handle the `/some/route` part.
  - Requests for static assets (e.g., `/app-a/assets/main.js`) are passed through without modification.
  - Requests to the root (`/`) are rewritten to `/index.html`.
  - Requests for paths that are not the root, do not match a known app prefix, and do not have a file extension (e.g., `/some/unknown/path`) are also rewritten to the root app's `/index.html`.

- **Request Flow Diagram:**

  ```mermaid
  sequenceDiagram
      participant Browser
      participant CloudFront as CloudFront CDN
      participant CFF as CloudFront Function (viewer-request)
      participant S3 as S3 Bucket

      Browser->>+CloudFront: Request URL (e.g., /app-a/route, /assets/img.png, /unknown)
      CloudFront->>+CFF: Viewer Request Event
      CFF->>CFF: Analyze URI

      alt SPA Route or Unknown Path (no file extension)
          CFF->>CFF: URI needs rewrite (e.g., /app-a/route -> /app-a/index.html, /unknown -> /index.html)
          Note right of CFF: Rewrites URI
      else Asset Request (has file extension)
          Note right of CFF: No rewrite needed
      end
      CFF-->>-CloudFront: Return request (potentially with rewritten URI)

      CloudFront->>+S3: Fetch object (e.g., /app-a/index.html, /assets/img.png, /index.html)
      S3-->>-CloudFront: Return object content
      CloudFront-->>-Browser: Return object content
  ```

### 3. Terraform Setup

- Located in the `terraform/` directory.

- Defines resources for:

  - S3 Bucket (static website hosting disabled, accessed via CloudFront Origin Access Control).
  - CloudFront Distribution (with OAC, custom domain, ACM certificate).
  - CloudFront Function (code defined inline or loaded from a file).
  - ACM Certificate (requires DNS validation via Cloudflare).
  - Route 53 Records (or manual CNAME creation in Cloudflare) to point the custom domain to the CloudFront distribution.

- Outputs essential values like the S3 bucket name and CloudFront distribution ID, which are needed for the `.env` file.

### 4. Deployment Scripts (`deploy.sh`)

- Each application directory (`app-a/`, `root-app/`, etc.) contains a `deploy.sh` script.

- **Steps:**
  1. Determines the correct S3 destination path (`s3://<bucket>/` for `root-app`, `s3://<bucket>/<app-name>/` otherwise) and CloudFront invalidation path (`/*` for `root-app`, `/<app-name>/*` otherwise).
  2. Runs `pnpm build` within the application directory to generate static assets in `dist/`.
  3. Uses `aws s3 sync` to upload the contents of `dist/` to the corresponding path in the S3 bucket.
     - For sub-apps (`app-a`, `app-b`, `app-c`), the `--delete` flag is used to remove old files within their specific S3 prefix.
     - For `root-app`, the `--delete` flag is **omitted** to prevent accidentally deleting the sub-app directories (prefixes) during the root deployment.
  4. Uses `aws cloudfront create-invalidation` to clear the CloudFront cache for the application's path (`/<app-prefix>/*` or `/*` for `root-app`), ensuring users receive the latest version.

### 5. Local Development

- Each application can be developed and run locally using Vite's development server (`pnpm dev`).
- The `vite.config.ts` for prefixed apps (`app-a`, `app-b`, `app-c`) sets the `base` option (e.g., `base: '/app-a/'`) to ensure asset paths and routing work correctly during development and in the deployed environment.

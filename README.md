# React SPA Deployment to AWS S3 + CloudFront via Terraform

This project demonstrates deploying multiple simple React SPAs (created with Vite + TypeScript) to a single AWS S3 bucket, served under different path prefixes (e.g., `/app-a/`, `/app-b/`). The applications are served globally via an AWS CloudFront distribution using a custom domain name managed through Cloudflare. A CloudFront Function handles request routing to ensure each SPA's client-side router works correctly.

For detailed information on the architecture, motivations, and implementation, please see the [Design Document](DESIGN.md).

The `app-a/`, `app-b/`, `app-c/`, and `root-app/` directories contain the individual React application code.
The `terraform/` directory contains the Infrastructure as Code (IaC) to provision the necessary AWS resources (S3 bucket, CloudFront distribution, CloudFront Function, ACM certificate).

## Prerequisites

- AWS Account & Credentials configured locally (e.g., via `~/.aws/credentials`)
- Terraform installed
- Node.js and pnpm installed
- Cloudflare Account
- A registered domain name managed by Cloudflare
- Create a `.env` file in the project root by copying `.env.example` (`cp .env.example .env`) and fill in the `S3_BUCKET_NAME` and `CLOUDFRONT_DISTRIBUTION_ID` values obtained from the Terraform output in Step 5.

### Deployment Steps

1. **Navigate to the app directory:**

   ```bash
   cd app-a # or app-b, app-c, root-app
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the application:**

   ```bash
   pnpm build
   ```

4. **Run the deployment script:**

   ```bash
   ./deploy.sh
   ```

   - The script loads credentials from the root `.env` file.
   - It uploads the built files from the `dist/` directory to the S3 bucket.
     - `app-a`, `app-b`, `app-c` deploy to prefixed paths (`/app-a/`, `/app-b/`, `/app-c/`) using `aws s3 sync --delete`.
     - `root-app` deploys to the S3 bucket root (`/`) using `aws s3 sync` **without** `--delete` to avoid removing sub-app directories.
   - It creates a CloudFront invalidation to ensure the latest version is served.

   **Note:** You can also use the `Justfile` in the root directory for convenience:
     - `just deploy-apps`: Deploys all applications.
     - `just deploy-infra`: Applies Terraform changes.
     - `just test`: Runs tests.
     - `just format`: Formats code.

## Cleaning Up

To remove all the AWS resources created by Terraform:

1. Navigate to the `terraform` directory:

   ```bash
   cd terraform
   ```

2. Run the destroy command:

   ```bash
   terraform destroy
   ```

3. Review the plan and type `yes` when prompted.
4. **Manual Step:** Remember to delete the CNAME records you created in Cloudflare.

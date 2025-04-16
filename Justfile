# Justfile for spa-aws-deploy

# Default recipe (show available recipes)
default:
    just --list

# Format code using Prettier
format:
    pnpm prettier --write .

# Build app-a
build-a:
    cd app-a && pnpm build

# Build app-b
build-b:
    cd app-b && pnpm build

# Build app-c
build-c:
    cd app-c && pnpm build

# Build root-app
build-root:
    cd root-app && pnpm build

# Build all apps
build-all: build-a build-b build-c build-root

# Deploy app-a (builds first)
deploy-a:
    just build-a
    cd app-a && sh ./deploy.sh

# Deploy app-b (builds first)
deploy-b:
    just build-b
    cd app-b && sh ./deploy.sh

# Deploy app-c (builds first)
deploy-c:
    just build-c
    cd app-c && sh ./deploy.sh

# Deploy root-app (builds first)
deploy-root:
    just build-root
    cd root-app && sh ./deploy.sh

# Deploy all apps
deploy-apps: deploy-a deploy-b deploy-c deploy-root

# Deploy infrastructure
deploy-infra:
    cd terraform && terraform apply -auto-approve

# Deploy everything (apps and infra)
deploy-full:
    just deploy-apps
    just deploy-infra

# Run tests for all packages
test:
    pnpm test

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.0"
}

provider "aws" {
  region = "us-east-1" # You can change this to your preferred region
}

# Provider for ACM certificate in us-east-1 (required for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Define variables (optional, but good practice)
variable "project_name" {
  description = "A unique name for the project resources"
  type        = string
  default     = "react-spa-deploy"
}

variable "domain_name" {
  description = "The custom domain name for the CloudFront distribution"
  type        = string
  # default     = "your-domain.com" # Replace with your actual domain or set via tfvars
}

variable "apex_domain_name" {
  description = "The apex domain name (e.g., example.com) managed in Route 53"
  type        = string
  # default     = "your-apex-domain.com" # Replace with your actual apex domain or set via tfvars
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "React SPA Deploy"
    ManagedBy = "Terraform"
  }
}

# S3 Bucket for storing the SPA build artifacts
resource "aws_s3_bucket" "spa_bucket" {
  bucket = "${var.project_name}-bucket" # Construct a unique bucket name

  tags = var.tags
}

# Bucket policy to allow CloudFront OAI read access
data "aws_iam_policy_document" "s3_cloudfront_read" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.spa_bucket.arn}/*"]

    principals {
      type        = "AWS"
      # Grant access only to the CloudFront Origin Access Identity
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "spa_bucket_policy" {
  bucket = aws_s3_bucket.spa_bucket.id
  # Use the policy granting access to the OAI
  policy = data.aws_iam_policy_document.s3_cloudfront_read.json
}

# CloudFront Origin Access Identity (OAI)
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.project_name}-bucket"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.spa_bucket.bucket_regional_domain_name
    origin_id   = "S3-${var.project_name}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.project_name}"
  # default_root_object = "index.html" # REMOVED - Handled by CloudFront Function

  # Add the custom domain name as an alias
  aliases = [var.domain_name]

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.project_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600 # 1 hour
    max_ttl                = 86400 # 24 hours

    # ADDED: Associate CloudFront Function for routing
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.viewer_request_rewrite.arn
    }
  }

  # Viewer certificate (using the validated ACM certificate)
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method  = "sni-only"
  }

  # Restrictions (no geo-restrictions by default)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = var.tags
}

# ADDED: CloudFront Function for Viewer Request Rewrites
resource "aws_cloudfront_function" "viewer_request_rewrite" {
  name    = "${var.project_name}-viewer-request-rewrite"
  runtime = "cloudfront-js-2.0" # Updated runtime
  comment = "Rewrites URIs for SPA routing under prefixes"
  publish = true
  code    = file("${path.module}/cloudfront-functions/viewer-request-rewrite/viewer_request_rewrite.js") # Updated path
}

# ACM Certificate for the custom domain
resource "aws_acm_certificate" "cert" {
  # ACM certificates for CloudFront must be requested in us-east-1
  provider = aws.us_east_1

  domain_name       = var.domain_name
  validation_method = "DNS" # Or EMAIL, DNS is generally preferred for automation

  tags = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

# ADDED: Data source to get the Route 53 zone ID
data "aws_route53_zone" "zone" {
  name         = var.apex_domain_name
  private_zone = false # Assuming it's a public zone
}

# Route 53 record for ACM certificate validation
resource "aws_route53_record" "cert_validation" {
  # Create one record for each validation option provided by the certificate
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.zone.zone_id # Now this reference is valid
}

# Wait for the ACM certificate to be validated using the DNS records
resource "aws_acm_certificate_validation" "cert" {
  provider = aws.us_east_1 # Must use the same provider as the certificate

  certificate_arn         = aws_acm_certificate.cert.arn
}

# ADDED: Route 53 record to point the custom domain to CloudFront
resource "aws_route53_record" "app_domain" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs
output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.spa_bucket.bucket
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.id
}

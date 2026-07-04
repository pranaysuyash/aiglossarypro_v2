# Deployment Cost Comparison

Date: 2026-06-30
Scope: Cloudflare vs AWS S3/EC2 for AIGlossary v2

## Decision Frame

The product is a paid-only content app with:

- a Worker/API layer
- JSON content delivery
- D1-backed user state
- Dodo billing
- auth provider integration

That means the cost question is mostly about:

1. the application/runtime plane
2. static content storage and delivery
3. user-state storage

## Current Official Pricing Signals

These numbers should be re-checked before launch because cloud pricing changes.

### Cloudflare

- Workers Paid starts at `$5/mo` with `10 million requests/month` included and `30 million CPU ms/month` included.
- D1 includes the first `25 billion rows read/month`, `50 million rows written/month`, and `5 GB stored`; beyond that it is usage-priced.
- R2 includes `10 GB-month` storage and `1 million` Class A / `10 million` Class B ops on the free tier, with paid storage at `$0.015/GB-month` and no egress fees.

Official pricing pages:

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/
- https://developers.cloudflare.com/r2/

### AWS

- S3 Standard storage is priced at `$0.023/GB-month` for the first `50 TB/month`, plus request costs.
- EC2 On-Demand is billed hourly/secondly depending on OS, so it introduces a fixed always-on compute floor when you run a server instance.

Official pricing pages:

- https://aws.amazon.com/s3/pricing/
- https://aws.amazon.com/ec2/pricing/

## Practical Recommendation

For this app, Cloudflare is the better overall default.

Why:

- the app is read-heavy and content-heavy
- the public corpus is JSON-first, so CDN-friendly delivery matters
- the user state is small relative to the content corpus
- a Worker + D1 + R2 stack keeps the deployment surface narrow
- there is no need for a continuously running VM just to serve mostly static content and light API state

AWS can still make sense if:

- the team already runs AWS heavily
- you want to standardize on S3 for asset storage and EC2/ECS for the app layer
- you expect much more custom backend compute later

But for this product, AWS is usually the more expensive and more operationally open-ended route.

## Deployment Shape I Would Use

### Preferred

- Cloudflare Worker for app/API
- D1 for bookmarks, notes, annotations, entitlements, share links, exports
- R2 for exported files or larger versioned content packs
- static content build artifacts served through Cloudflare

### Not Preferred

- EC2 for the main app
- S3 as the only content plane plus a separately managed server for APIs

## Rough Cost Expectations

These are order-of-magnitude planning numbers, not quotes.

- The current published corpus is about `59 MB`, so content storage cost is negligible on both providers.
- At that size, Cloudflare R2 storage is roughly `well under $0.01/month` and AWS S3 Standard storage is also roughly `well under $0.01/month`.
- Cloudflare baseline can stay around the Workers paid-plan floor for early launch if traffic stays moderate and content remains static-first.
- AWS S3 is cheap for storage, but it does not replace the app/runtime bill.
- AWS EC2 introduces a fixed monthly compute floor even before storage, egress, or database costs.
- For this app, the Cloudflare stack is usually the lower-cost and lower-ops default.

If you want, I can next turn this into a concrete launch budget table with three traffic bands:

1. early beta
2. first 1,000 paid users
3. first 10,000 paid users

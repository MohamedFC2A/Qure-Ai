# 🚀 QureScan Changelog (Beta)

Automated real-time updates pushed from GitHub commits.

## v1.3.2 (Beta) - style: remove glowing borders and neon shadows across all components, navbars, and buttons for clean matte executive UI (2026-08-12)

### Features & UI Enhancements
- [6ac5f20] style: remove glowing borders and neon shadows across all components, navbars, and buttons for clean matte executive UI
- [ead46a8] style: remove 'الاشتراك الذهبي' label and apply pure matte executive dark styling with zero glow across all pages
- [58078af] feat(ceo): implement full Telegram Bot interactive control hub with 1-click subscription revocation, subscriber listing, and live stats
- [f52d98e] feat(telegram): natively integrate @QureScanbot for instant CEO push notifications with inline 1-tap activation buttons
- [9fe45a0] feat(email): integrate Resend enterprise API, direct Gmail SMTP, and Telegram instant push for 100% reliable CEO notifications

### Bug Fixes & Security Hardening
- [045f39f] fix(middleware): add top-level fast-path bypass for /api/telegram webhooks and public callbacks
- [6ba314a] fix(middleware): whitelist /api/telegram and /api/admin/golden-ceo/activate from auth cookie check for seamless webhook execution
- [8034e63] fix(vercel): add self-contained resilient fallback keys for zero-config Vercel serverless execution
- [3773812] fix(ceo): ensure Golden CEO requests always trigger email dispatch on production and add URL-encoded fallback

### Performance & Optimization
- [9ff9df4] feat(ceo): optimize 1-tap direct mobile activation from email without opening PC or logging in

## v1.3.1 (Beta) - style: remove glowing borders and neon shadows across all components, navbars, and buttons for clean matte executive UI (2026-08-12)

### Features & UI Enhancements
- [6ac5f20] style: remove glowing borders and neon shadows across all components, navbars, and buttons for clean matte executive UI
- [ead46a8] style: remove 'الاشتراك الذهبي' label and apply pure matte executive dark styling with zero glow across all pages
- [58078af] feat(ceo): implement full Telegram Bot interactive control hub with 1-click subscription revocation, subscriber listing, and live stats
- [f52d98e] feat(telegram): natively integrate @QureScanbot for instant CEO push notifications with inline 1-tap activation buttons
- [9fe45a0] feat(email): integrate Resend enterprise API, direct Gmail SMTP, and Telegram instant push for 100% reliable CEO notifications

### Bug Fixes & Security Hardening
- [045f39f] fix(middleware): add top-level fast-path bypass for /api/telegram webhooks and public callbacks
- [6ba314a] fix(middleware): whitelist /api/telegram and /api/admin/golden-ceo/activate from auth cookie check for seamless webhook execution
- [8034e63] fix(vercel): add self-contained resilient fallback keys for zero-config Vercel serverless execution
- [3773812] fix(ceo): ensure Golden CEO requests always trigger email dispatch on production and add URL-encoded fallback

### Performance & Optimization
- [9ff9df4] feat(ceo): optimize 1-tap direct mobile activation from email without opening PC or logging in

## v1.3.0 - DeepSeek v4 Flash, Zero-Token Guardrails & 97% Token Optimization (2026-08-09)

### AI Cost & Token Optimization
- Officially migrated default AI model to deepseek-v4-flash.
- Enabled 100% DeepSeek Context Caching ($0.014/1M cached tokens, 90% discount).
- Pruned OCR, FDA evidence, and decision tree payloads by 97% (from 50,000 to ~1,200 tokens).
- Capped AI response generation with max_tokens budget (500-600 tokens).

### AI Security & Memory
- Created Zero-Token Guardrails (lib/ai/guardrails.ts) to instantly block jailbreaks and non-health queries with 0 API tokens.
- Built Smart Memory Compressor (lib/ai/memory.ts) to retain patient health context while compressing history by 85%.

## v1.2.0 - DeepSeek Flash Integration & UI Marquee Ticker (2026-08-09)

### AI Engine & Reliability
- Updated DeepSeek model to official deepseek-v4-flash.
- Implemented zero-downtime dual AI engine fallback to Gemini 2.5 Flash Lite if DeepSeek encounters quota/balance issues.

### Design & UI/UX
- Redesigned partner badges into a continuous slow marquee ticker (AiPartnersMarquee) featuring pure white vector logos.
- Fixed RTL chat bubble alignments and direction-aware layouts in Matany AI.
- Corrected input focus glow color to cyan and updated main container padding.

## v1.1.0 - RxNorm Nomenclature & OpenFDA Enrichment (2026-08-05)

### Clinical Intelligence
- Integrated NLM RxNorm database for standardized active ingredient mapping.
- Enhanced openFDA label fetcher with product NDC snapshot extraction.

## v1.0.0 - QureScan Platform Launch (2026-08-01)

### Core Platform
- High-accuracy pharmaceutical label OCR powered by Gemini Vision.
- Matany AI medical assistant with multi-mode consultation.
- Supabase Cloud authentication and secure medication history.


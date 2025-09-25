# Claude Code Configuration

This file contains commands and settings for Claude Code to assist with this project.

## Project Overview

MeetMe Generator - A Cloudflare Worker that extracts LinkedIn profile images and generates branded overlay images.

## Development Commands

```bash
# Start development server
npm run dev

# Deploy to Cloudflare
npm run deploy

# Install dependencies
npm install

# No lint/typecheck commands available (pure JavaScript project)
```

## Build System

- **Runtime**: Cloudflare Workers (V8 Edge Runtime)
- **Build Tool**: Wrangler 4.39.0
- **Language**: JavaScript (ES Modules)
- **Compatibility Date**: 2025-09-24

## Project Structure

```
src/
├── index.js              # Main worker entry point (695 lines)
assets/
├── frame-01.png          # Frame overlay asset
wrangler.toml             # Cloudflare Worker configuration
package.json              # Dependencies and scripts
README.md                 # Project documentation
```

## Key Features

- ✅ LinkedIn profile image extraction via web scraping
- ✅ HTML form interface with styled UI
- ✅ Visual result page showing extracted images
- ✅ Image proxy endpoint to handle CORS issues
- ✅ Download functionality for profile images
- ✅ Comprehensive error handling and user feedback
- ✅ Fallback handling for LinkedIn 999/403 errors
- ✅ Multiple extraction methods (og:image, profile elements, media patterns)
- 🚧 Frame overlay generation (OffscreenCanvas not available in Workers)

## Technical Implementation

### Current Routes
- `GET /` - HTML form interface
- `POST /generate` - Extract LinkedIn profile image and show result page
- `POST /download` - Download extracted image
- `GET /proxy-image` - Proxy images to bypass CORS restrictions

### LinkedIn Extraction Methods
1. **og:image meta tag** (primary method)
2. **Alternative og:image formats**
3. **Profile image elements**
4. **Media pattern matching**
5. **Fallback placeholder for blocked requests**

### Anti-Scraping Measures
- Comprehensive browser headers (User-Agent, Referer, Accept, etc.)
- HTML entity decoding (`&amp;` → `&`)
- 403/999 error handling with helpful user guidance
- Image proxy to bypass CORS issues

## Development Notes

- All functionality working except frame overlay (requires external service)
- Robust error handling with detailed user feedback pages
- Image proxy prevents CORS issues when displaying LinkedIn images
- Comprehensive logging for debugging
- SVG placeholder fallback for inaccessible images

## Known Limitations

- **No OffscreenCanvas**: Image composition requires external service
- **LinkedIn Anti-Bot**: Some profiles may return 999/403 status codes
- **File System**: No direct asset access (frame must be embedded as base64)
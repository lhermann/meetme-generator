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

# Run linting (when available)
npm run lint

# Run type checking (when available)
npm run typecheck
```

## Build System

- **Runtime**: Cloudflare Workers (V8 Edge Runtime)
- **Build Tool**: Wrangler 4.39.0
- **Language**: JavaScript (ES Modules)
- **Compatibility Date**: 2025-09-24

## Project Structure

```
src/
├── index.js              # Main worker entry point
assets/
├── frame-01.png          # Frame overlay asset
wrangler.toml             # Cloudflare Worker configuration
package.json              # Dependencies and scripts
```

## Key Features

- ✅ LinkedIn profile image extraction via web scraping
- ✅ HTML form interface
- ✅ Comprehensive logging for debugging
- ✅ Error handling for various edge cases
- 🚧 Frame overlay generation (OffscreenCanvas limitation)

## Technical Constraints

### Cloudflare Workers Limitations

1. **No OffscreenCanvas**: Browser APIs like Canvas aren't available
2. **Image Processing**: Limited to basic fetch/response operations
3. **File System**: No direct file system access (assets must be embedded)

### LinkedIn Anti-Scraping

- Profile images require proper User-Agent and Referer headers
- Some profiles may return 403 for direct image access
- HTML entity decoding required (`&amp;` → `&`)

## Testing

```bash
# Test LinkedIn profile extraction
curl -X POST http://localhost:8787/generate \
  -d "linkedinUrl=https://www.linkedin.com/in/username/" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  -o profile-image.jpg
```

## Development Notes

- LinkedIn profile extraction works reliably for public profiles
- Image overlay requires alternative approach (external service or pre-processing)
- Comprehensive logging enabled for debugging (`wrangler.toml`)
- Regex patterns handle multiple LinkedIn URL formats

## Next Steps

1. **Frame Integration**: Embed frame-01.png as base64 or use external processing
2. **Image Composition**: Consider Cloudflare Images API for overlays
3. **Error Handling**: Add more robust error handling for edge cases
4. **Rate Limiting**: Implement rate limiting for production use
# MeetMe Generator

A Cloudflare Worker tool that extracts LinkedIn profile images and generates branded overlay images for social media sharing.

## Features

- ✅ Extract LinkedIn profile images from public profile URLs
- ✅ Simple web interface for URL input
- ✅ Direct image download
- 🚧 Frame overlay generation (in development)

## How It Works

1. **Profile Image Extraction**: Uses web scraping to extract profile images from public LinkedIn profiles
2. **Image Processing**: Fetches and processes profile images with proper headers to bypass anti-scraping measures
3. **Download**: Returns processed images as downloadable files

## Usage

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:8787` and enter a LinkedIn profile URL like:
```
https://www.linkedin.com/in/username/
```

### Deployment

```bash
npm run deploy
```

## API

### POST /generate

Extract and process a LinkedIn profile image.

**Request:**
```bash
curl -X POST https://your-worker.domain.com/generate \
  -d "linkedinUrl=https://www.linkedin.com/in/username/" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  -o profile-image.jpg
```

**Parameters:**
- `linkedinUrl`: The LinkedIn profile URL to extract the image from

**Response:**
- Success: Returns the profile image as JPEG
- Error: Returns error message with appropriate HTTP status code

## Technical Details

### LinkedIn Profile Image Extraction

The tool uses a multi-step approach:

1. **URL Parsing**: Extracts username from LinkedIn URL pattern
2. **HTML Fetching**: Retrieves the LinkedIn profile page with proper User-Agent headers
3. **Image URL Extraction**: Uses regex patterns to find profile image URLs in HTML
4. **Image Fetching**: Downloads the image with anti-scraping headers

### Supported URL Formats

- `https://www.linkedin.com/in/username/`
- `https://linkedin.com/in/username`
- `https://www.linkedin.com/in/username`

### Limitations

- Only works with public LinkedIn profiles
- Profile images must be publicly accessible
- Rate limiting may apply for high-volume usage

## Development Notes

### Image Processing Constraints

Cloudflare Workers don't support `OffscreenCanvas` or similar browser APIs for image processing. For advanced image manipulation:

1. **External Services**: Use services like Cloudflare Images API
2. **Pre-processed Assets**: Embed frame overlays as base64
3. **Edge Computing**: Consider Cloudflare Pages Functions for more capabilities

### Logging

The application includes comprehensive logging for debugging:

```javascript
// Enable in wrangler.toml
[observability.logs]
enabled = true
```

## Project Structure

```
meetme-generator/
├── src/
│   └── index.js          # Main worker code
├── assets/
│   └── frame-01.png      # Frame overlay image
├── wrangler.toml         # Cloudflare Worker configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run dev`
5. Deploy with `npm run deploy`
6. Submit a pull request

## License

ISC License

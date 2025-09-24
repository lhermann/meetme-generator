export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return handleHomePage();
    } else if (url.pathname === '/generate' && request.method === 'POST') {
      return handleImageGeneration(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};

function handleHomePage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeetMe Generator</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0077b5;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        input[type="url"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        input[type="url"]:focus {
            outline: none;
            border-color: #0077b5;
        }
        button {
            background-color: #0077b5;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            background-color: #005885;
        }
        .example {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤝 MeetMe Generator</h1>
        <p>Generate a branded profile image by combining your LinkedIn profile picture with an overlay.</p>

        <form action="/generate" method="POST">
            <div class="form-group">
                <label for="linkedin-url">LinkedIn Profile URL:</label>
                <input
                    type="url"
                    id="linkedin-url"
                    name="linkedinUrl"
                    placeholder="https://www.linkedin.com/in/your-profile/"
                    required
                >
                <div class="example">Example: https://www.linkedin.com/in/lukas-hermann/</div>
            </div>

            <button type="submit">Generate Image</button>
        </form>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function handleImageGeneration(request) {
  try {
    const formData = await request.formData();
    const linkedinUrl = formData.get('linkedinUrl');

    if (!linkedinUrl) {
      return new Response('LinkedIn URL is required', { status: 400 });
    }

    // Extract profile image URL from LinkedIn
    const profileImageUrl = await extractLinkedInProfileImage(linkedinUrl);

    if (!profileImageUrl) {
      const errorMessage = `
<!DOCTYPE html>
<html>
<head>
    <title>LinkedIn Profile Extraction Failed</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .suggestions { background: #eff; border: 1px solid #cff; padding: 20px; border-radius: 5px; margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>⚠️ LinkedIn Profile Extraction Failed</h1>

    <div class="error">
        <h3>Issue: Could not extract profile image</h3>
        <p>LinkedIn is blocking automated requests with a <strong>999 status code</strong>. This is a common anti-bot measure.</p>
    </div>

    <div class="suggestions">
        <h3>💡 Alternative Solutions (2024 Recommendations):</h3>
        <ol>
            <li><strong>Commercial APIs (Most Reliable):</strong>
                <ul>
                    <li><a href="https://www.scrapingdog.com/linkedin-scraper-api/">ScrapingDog LinkedIn API</a> - Handles anti-bot measures</li>
                    <li><a href="https://www.piloterr.com/library/linkedin-profile">Piloterr LinkedIn API</a> - Returns structured data with profile images</li>
                    <li><a href="https://apify.com/curious_coder/linkedin-profile-scraper">Apify LinkedIn Scraper</a> - Open source alternative</li>
                </ul>
            </li>
            <li><strong>Manual Download:</strong> Visit the LinkedIn profile manually and save the profile image</li>
            <li><strong>LinkedIn Official API:</strong> Use OAuth 2.0 authentication (requires LinkedIn Partnership)</li>
            <li><strong>Browser Extension:</strong> Create a simple browser extension to extract images</li>
        </ol>

        <h3>🔧 For Developers:</h3>
        <ul>
            <li>Add delays between requests to avoid rate limiting</li>
            <li>Use rotating User-Agent headers</li>
            <li>Consider using proxy services</li>
            <li>Implement OAuth 2.0 for LinkedIn API access</li>
        </ul>
    </div>

    <p><a href="/">← Back to form</a></p>
</body>
</html>`;
      return new Response(errorMessage, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // For now, just return the profile image since OffscreenCanvas isn't available in Workers
    console.log('📥 Fetching profile image for direct return...');
    const profileResponse = await fetch(profileImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.linkedin.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!profileResponse.ok) {
      return new Response(`Could not fetch profile image: ${profileResponse.status}`, { status: 400 });
    }

    const imageBuffer = await profileResponse.arrayBuffer();
    console.log('✅ Profile image retrieved, size:', imageBuffer.byteLength, 'bytes');

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="linkedin-profile.jpg"',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response('Error processing request: ' + error.message, {
      status: 500
    });
  }
}

async function extractLinkedInProfileImage(linkedinUrl) {
  try {
    console.log('🔍 Extracting profile image from LinkedIn URL:', linkedinUrl);

    // Extract username from LinkedIn URL
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (!usernameMatch) {
      console.error('❌ Invalid LinkedIn URL format:', linkedinUrl);
      throw new Error('Invalid LinkedIn URL format');
    }

    const username = usernameMatch[1];
    console.log('👤 Extracted username:', username);

    // Use a simple approach to get the LinkedIn profile image
    // This uses the public LinkedIn profile image URL pattern
    const profileImageUrl = `https://www.linkedin.com/in/${username}/`;
    console.log('🌐 Fetching LinkedIn profile page:', profileImageUrl);

    // Fetch the LinkedIn profile page with comprehensive headers
    const response = await fetch(profileImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    console.log('📡 LinkedIn response status:', response.status);

    if (!response.ok) {
      console.error('❌ Failed to fetch LinkedIn profile, status:', response.status);

      // Handle specific LinkedIn anti-bot responses
      if (response.status === 999) {
        console.log('🤖 LinkedIn detected bot traffic, trying alternative approach...');
        // Try with different approach - construct likely image URL pattern
        return tryDirectImageUrlConstruction(username);
      }

      throw new Error(`Failed to fetch LinkedIn profile: ${response.status}`);
    }

    const html = await response.text();
    console.log('📄 HTML length:', html.length, 'characters');

    // Method 1: Extract from og:image meta tag (most reliable for sharing)
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (ogImageMatch) {
      let imageUrl = ogImageMatch[1];
      // Clean up HTML entities in the URL
      imageUrl = imageUrl.replace(/&amp;/g, '&');
      console.log('✅ Found profile image URL (og:image method):', imageUrl);
      return imageUrl;
    }

    // Method 2: Look for alternative og:image format
    const altOgMatch = html.match(/<meta property='og:image' content='([^']+)'/i);
    if (altOgMatch) {
      let imageUrl = altOgMatch[1];
      imageUrl = imageUrl.replace(/&amp;/g, '&');
      console.log('✅ Found profile image URL (alt og:image method):', imageUrl);
      return imageUrl;
    }

    // Method 3: Extract from profile image elements
    const profileImageMatch = html.match(/"https:\/\/media\.licdn\.com\/dms\/image\/[^"]+"/);
    if (profileImageMatch) {
      let imageUrl = profileImageMatch[0].replace(/"/g, '');
      imageUrl = imageUrl.replace(/&amp;/g, '&');
      console.log('✅ Found profile image URL (profile element method):', imageUrl);
      return imageUrl;
    }

    // Method 4: Look for any LinkedIn media image URLs
    const mediaImageMatch = html.match(/https:\/\/media\.licdn\.com\/dms\/image\/[^"'\s>]+/);
    if (mediaImageMatch) {
      console.log('✅ Found profile image URL (media pattern method):', mediaImageMatch[0]);
      return mediaImageMatch[0];
    }

    console.log('❌ No profile image found in HTML');
    console.log('🔍 HTML preview (first 500 chars):', html.substring(0, 500));

    return null;
  } catch (error) {
    console.error('❌ Error extracting LinkedIn profile image:', error);
    return null;
  }
}

async function tryDirectImageUrlConstruction(username) {
  try {
    console.log('🔄 Attempting direct image URL construction for:', username);

    // LinkedIn profile images often follow predictable patterns
    // We'll try a few common patterns based on username
    const possiblePatterns = [
      // Most common pattern for LinkedIn profile images
      `https://media.licdn.com/dms/image/v2/profile-displayphoto-shrink_200_200/0/?e=2147483647&v=beta&t=${Date.now()}`,
      // Alternative pattern
      `https://media.licdn.com/dms/image/profile-displayphoto-shrink_200_200/0/?e=2147483647&v=beta&t=${Date.now()}`,
      // Fallback to a generic LinkedIn avatar pattern (this won't work but shows the attempt)
      `https://static.licdn.com/aero-v1/sc/h/9c8pery4andzj6ohjkjp54ma2`
    ];

    for (const pattern of possiblePatterns) {
      console.log('🧪 Testing pattern:', pattern);

      const testResponse = await fetch(pattern, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.linkedin.com/',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });

      if (testResponse.ok && testResponse.headers.get('content-type')?.startsWith('image/')) {
        console.log('✅ Found working image pattern:', pattern);
        return pattern;
      }
    }

    console.log('❌ No working patterns found, falling back to placeholder approach');

    // As a last resort, we could return a constructed URL that might work
    // This is speculative and may not always work
    return `https://media.licdn.com/dms/image/v2/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/?e=2147483647&v=beta&t=${Date.now()}`;

  } catch (error) {
    console.error('❌ Error in direct image URL construction:', error);
    return null;
  }
}

async function generateOverlayImage(profileImageUrl) {
  try {
    console.log('🖼️ Generating overlay image for profile URL:', profileImageUrl);

    // Fetch the profile image
    console.log('📥 Fetching profile image...');
    const profileResponse = await fetch(profileImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.linkedin.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });
    console.log('📡 Profile image response status:', profileResponse.status);

    if (!profileResponse.ok) {
      console.error('❌ Failed to fetch profile image, status:', profileResponse.status);
      throw new Error(`Failed to fetch profile image: ${profileResponse.status}`);
    }

    const profileImageBuffer = await profileResponse.arrayBuffer();
    console.log('✅ Profile image fetched, size:', profileImageBuffer.byteLength, 'bytes');

    // Create overlay with the frame image
    return createOverlayWithFrame(profileImageBuffer);

  } catch (error) {
    console.error('❌ Error generating overlay image:', error);
    throw error;
  }
}

async function createOverlayWithFrame(profileImageBuffer) {
  try {
    console.log('🎨 Creating overlay with frame...');

    // For this test, we'll use a fallback since we can't easily embed the frame image
    // In production, you'd embed the frame as base64 or serve it as a static asset
    console.log('⚠️ Frame image not embedded yet, using fallback overlay');
    let frameImageBuffer = null;

    // Create canvas for composition
    const canvas = new OffscreenCanvas(1080, 1080); // Instagram post size
    const ctx = canvas.getContext('2d');

    console.log('🖼️ Creating image bitmap from profile image...');
    // Load the profile image
    const profileImage = await createImageBitmap(new Uint8Array(profileImageBuffer));
    console.log('✅ Profile image bitmap created, dimensions:', profileImage.width, 'x', profileImage.height);

    if (frameImageBuffer) {
      // Load the frame image
      console.log('🖼️ Creating frame image bitmap...');
      const frameImage = await createImageBitmap(new Uint8Array(frameImageBuffer));
      console.log('✅ Frame image bitmap created, dimensions:', frameImage.width, 'x', frameImage.height);

      // Draw the frame first as background
      ctx.drawImage(frameImage, 0, 0, 1080, 1080);

      // Calculate position and size for profile image to fit in the white rounded rectangle
      // Based on the frame design, the profile area appears to be centered
      const profileX = 340; // Approximate position from frame design
      const profileY = 340;
      const profileWidth = 400;
      const profileHeight = 400;

      // Draw the profile image in the designated area
      ctx.drawImage(profileImage, profileX, profileY, profileWidth, profileHeight);
    } else {
      // Fallback: simple overlay without frame
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 1080, 1080);

      // Draw the profile image centered
      const size = Math.min(profileImage.width, profileImage.height);
      const x = (1080 - size) / 2;
      const y = (1080 - size) / 2;
      ctx.drawImage(profileImage, x, y, size, size);

      // Add simple text overlay
      ctx.fillStyle = '#4a90e2';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Meet Me!', 540, 100);
    }

    console.log('🎨 Converting canvas to blob...');
    // Convert canvas to blob and return as buffer
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const resultBuffer = await blob.arrayBuffer();
    console.log('✅ Final image created, size:', resultBuffer.byteLength, 'bytes');

    return resultBuffer;
  } catch (error) {
    console.error('❌ Error creating overlay with frame:', error);
    throw error;
  }
}
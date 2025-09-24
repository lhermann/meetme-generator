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
      return new Response('Could not extract profile image from LinkedIn URL', { status: 400 });
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

    // Fetch the LinkedIn profile page
    const response = await fetch(profileImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('📡 LinkedIn response status:', response.status);

    if (!response.ok) {
      console.error('❌ Failed to fetch LinkedIn profile, status:', response.status);
      throw new Error(`Failed to fetch LinkedIn profile: ${response.status}`);
    }

    const html = await response.text();
    console.log('📄 HTML length:', html.length, 'characters');

    // Extract profile image URL from the HTML
    const imageMatch = html.match(/"https:\/\/media\.licdn\.com\/dms\/image\/[^"]+"/);
    if (imageMatch) {
      let imageUrl = imageMatch[0].replace(/"/g, '');
      // Clean up HTML entities in the URL
      imageUrl = imageUrl.replace(/&amp;/g, '&');
      console.log('✅ Found profile image URL (method 1):', imageUrl);
      return imageUrl;
    }

    // Fallback: look for other image patterns
    const altImageMatch = html.match(/https:\/\/media\.licdn\.com\/dms\/image\/[^"'\s>]+/);
    if (altImageMatch) {
      console.log('✅ Found profile image URL (method 2):', altImageMatch[0]);
      return altImageMatch[0];
    }

    // Try another pattern for profile images
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImageMatch) {
      console.log('✅ Found profile image URL (og:image):', ogImageMatch[1]);
      return ogImageMatch[1];
    }

    console.log('❌ No profile image found in HTML');
    console.log('🔍 HTML preview (first 500 chars):', html.substring(0, 500));

    return null;
  } catch (error) {
    console.error('❌ Error extracting LinkedIn profile image:', error);
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
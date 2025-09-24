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

    // Generate the overlay image
    const overlayImageBuffer = await generateOverlayImage(profileImageUrl);

    return new Response(overlayImageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="meetme-profile.png"',
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
    // Extract username from LinkedIn URL
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (!usernameMatch) {
      throw new Error('Invalid LinkedIn URL format');
    }

    const username = usernameMatch[1];

    // Use a simple approach to get the LinkedIn profile image
    // This uses the public LinkedIn profile image URL pattern
    const profileImageUrl = `https://www.linkedin.com/in/${username}/`;

    // Fetch the LinkedIn profile page
    const response = await fetch(profileImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn profile');
    }

    const html = await response.text();

    // Extract profile image URL from the HTML
    const imageMatch = html.match(/"https:\/\/media\.licdn\.com\/dms\/image\/[^"]+"/);
    if (imageMatch) {
      return imageMatch[0].replace(/"/g, '');
    }

    // Fallback: look for other image patterns
    const altImageMatch = html.match(/https:\/\/media\.licdn\.com\/dms\/image\/[^"'\s>]+/);
    if (altImageMatch) {
      return altImageMatch[0];
    }

    return null;
  } catch (error) {
    console.error('Error extracting LinkedIn profile image:', error);
    return null;
  }
}

async function generateOverlayImage(profileImageUrl) {
  try {
    // Fetch the profile image
    const profileResponse = await fetch(profileImageUrl);
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch profile image');
    }

    const profileImageBuffer = await profileResponse.arrayBuffer();

    // Create a simple overlay using Canvas API (this is a simplified version)
    // In a real implementation, you'd use a proper image processing library

    // For now, we'll create a simple composite image
    // This is a placeholder - you'll need to implement actual image processing

    // Create a basic overlay effect by returning the profile image with some modifications
    return createSimpleOverlay(profileImageBuffer);

  } catch (error) {
    console.error('Error generating overlay image:', error);
    throw error;
  }
}

async function createSimpleOverlay(profileImageBuffer) {
  // This is a simplified implementation
  // In a production environment, you'd want to use a proper image processing library

  // For now, we'll just return the original image with some basic modifications
  // You would typically use libraries like Sharp or similar for image processing

  // Create a simple overlay by adding some basic image data
  const canvas = new OffscreenCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  // Load the profile image
  const profileImage = await createImageBitmap(new Uint8Array(profileImageBuffer));

  // Draw the profile image
  ctx.drawImage(profileImage, 0, 0, 400, 400);

  // Add a simple overlay (frame/border)
  ctx.strokeStyle = '#0077b5';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 400, 400);

  // Add some text overlay
  ctx.fillStyle = '#0077b5';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Meet Me!', 200, 50);

  // Convert canvas to blob and return as buffer
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return await blob.arrayBuffer();
}
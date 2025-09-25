export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return handleHomePage();
    } else if (url.pathname === '/generate' && request.method === 'POST') {
      return handleImageGeneration(request, env);
    } else if (url.pathname === '/download' && request.method === 'POST') {
      return handleImageDownload(request);
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
        input[type="file"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        input[type="file"]:focus {
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
        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .preview-area {
            margin-top: 15px;
            border: 2px dashed #ddd;
            border-radius: 5px;
            padding: 20px;
            text-align: center;
            color: #666;
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .preview-image {
            max-width: 100%;
            max-height: 200px;
            border-radius: 5px;
        }
        .file-info {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        .upload-hint {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤝 MeetMe Generator</h1>
        <p>Upload your photo and generate a branded MeetMe image with the official frame overlay.</p>

        <form action="/generate" method="POST" enctype="multipart/form-data" id="uploadForm">
            <div class="form-group">
                <label for="image-upload">Upload Your Photo:</label>
                <input
                    type="file"
                    id="image-upload"
                    name="image"
                    accept="image/*"
                    required
                >
                <div class="upload-hint">Supported formats: JPEG, PNG, WebP, GIF (max 10MB)</div>
                <div class="preview-area" id="preview">
                    Drag & drop your image here or click to select
                </div>
            </div>

            <button type="submit" id="generateBtn">Generate MeetMe Image</button>
        </form>
    </div>

    <script>
        const fileInput = document.getElementById('image-upload');
        const preview = document.getElementById('preview');
        const form = document.getElementById('uploadForm');
        const generateBtn = document.getElementById('generateBtn');

        fileInput.addEventListener('change', handleFileSelect);
        preview.addEventListener('dragover', handleDragOver);
        preview.addEventListener('drop', handleDrop);
        preview.addEventListener('click', () => fileInput.click());
        form.addEventListener('submit', handleSubmit);

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                showPreview(file);
            }
        }

        function handleDragOver(event) {
            event.preventDefault();
            preview.style.borderColor = '#0077b5';
        }

        function handleDrop(event) {
            event.preventDefault();
            preview.style.borderColor = '#ddd';

            const files = event.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                showPreview(files[0]);
            }
        }

        function showPreview(file) {
            // Validate file size
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                fileInput.value = '';
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                fileInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = \`
                    <img src="\${e.target.result}" class="preview-image" alt="Preview">
                    <div class="file-info">
                        \${file.name} (\${(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                \`;
            };
            reader.readAsDataURL(file);
        }

        function handleSubmit(event) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Processing...';
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function handleImageGeneration(request, env) {

  // Frame dimensions: 1080x1350
  // Hole dimensions: 554x679
  // Hole top left corner x,y: 263,350

  try {
    const formData = await request.formData();
    const uploadedFile = formData.get('image');

    if (!uploadedFile) {
      return new Response('Image file is required', { status: 400 });
    }

    // Validate file type
    if (!uploadedFile.type.startsWith('image/')) {
      return new Response('Invalid file type. Please upload an image.', { status: 400 });
    }

    // Validate file size (10MB max)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      return new Response('File too large. Maximum size is 10MB.', { status: 400 });
    }

    console.log('Processing uploaded file:', uploadedFile.name, 'Size:', uploadedFile.size, 'Type:', uploadedFile.type);

    // User image as ArrayBuffer (from FormData)
    const userImageArrayBuffer = await uploadedFile.arrayBuffer();
    console.log('[handleImageGeneration] userImageArrayBuffer', userImageArrayBuffer.byteLength);

    // Get user image as ReadableStream (from arrayBuffer)
    const userImageStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(userImageArrayBuffer));
        controller.close();
      }
    });
    console.log('[handleImageGeneration] userImageStream created');

    // Method 1: Fetch frame from R2 as ReadableStream
    const frameResponse = await fetch('https://meetme-generator-r2.stagetimer.io/frame-01.png');
    const frameStream = frameResponse.body; // ReadableStream
    console.log('[handleImageGeneration] frameStream created, response status:', frameResponse.status);

    // Now use both ReadableStreams with Images API
    const result = await env.IMAGES
      .input(frameStream)
      .transform({ width: 1080, height: 1350 })
      .draw([
        {
          url: 'https://meetme-generator-r2.stagetimer.io/frame-01.png',
          width: 100,
          height: 100,
          opacity: 0.8,
        },
        {
          input: userImageStream,
          width: 100,
          height: 100,
          opacity: 0.8,
        }
      ])
      .output({ format: 'image/png' });

    console.log('[handleImageGeneration] Images API processing complete');

    // Get final result
    const finalStream = await result.image();
    const finalBuffer = await streamToArrayBuffer(finalStream);
    console.log('[handleImageGeneration] Final result size:', finalBuffer.byteLength);

    return showImageResultPage(uploadedFile.name, finalBuffer);
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response('Error processing image: ' + error.message, {
      status: 500
    });
  }
}

function showImageResultPage(originalFilename, imageBuffer) {
  // Convert buffer to base64 for display
  const base64Image = arrayBufferToBase64(imageBuffer);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your MeetMe Image - Generated</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
            text-align: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #0077b5;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .result-image {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .actions {
            margin-top: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background-color: #0077b5;
            color: white;
        }
        .btn-primary:hover {
            background-color: #005885;
        }
        .btn-secondary {
            background-color: #f0f0f0;
            color: #333;
        }
        .btn-secondary:hover {
            background-color: #e0e0e0;
        }
        .filename {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">🎉</div>
        <h1>Your MeetMe Image is Ready!</h1>
        <p class="subtitle">Your image has been successfully processed with the MeetMe frame overlay.</p>

        <img src="data:image/png;base64,${base64Image}" alt="Generated MeetMe Image" class="result-image">

        <div class="filename">Based on: ${originalFilename}</div>

        <div class="actions">
            <form action="/download" method="POST" style="display: inline;">
                <input type="hidden" name="imageData" value="${base64Image}">
                <input type="hidden" name="filename" value="meetme-${originalFilename}">
                <button type="submit" class="btn btn-primary">💾 Download Image</button>
            </form>

            <a href="/" class="btn btn-secondary">🔄 Generate Another</a>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function handleImageDownload(request) {
  try {
    const formData = await request.formData();
    const imageData = formData.get('imageData');
    const filename = formData.get('filename') || 'meetme-image.png';

    if (!imageData) {
      return new Response('No image data provided', { status: 400 });
    }

    // Convert base64 back to binary
    const imageBuffer = base64ToArrayBuffer(imageData);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.byteLength.toString()
      }
    });
  } catch (error) {
    return new Response('Error downloading image: ' + error.message, {
      status: 500
    });
  }
}


// Utility functions
async function streamToArrayBuffer(stream) {
  console.log('Converting ReadableStream to ArrayBuffer...');

  if (!stream) {
    console.error('Stream is null or undefined');
    return new ArrayBuffer(0);
  }

  const chunks = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Calculate total length
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  console.log('Total stream length:', totalLength);

  // Combine all chunks
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  console.log('Stream conversion complete, buffer size:', result.buffer.byteLength);
  return result.buffer;
}

function arrayBufferToBase64(buffer) {
  console.log('Converting to base64...');
  console.log('Buffer type:', typeof buffer);
  console.log('Buffer constructor:', buffer?.constructor?.name);
  console.log('Buffer length:', buffer?.byteLength || buffer?.length);

  if (!buffer) {
    console.error('Buffer is null or undefined');
    return '';
  }

  let bytes;
  if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else {
    console.error('Unsupported buffer type:', typeof buffer);
    return '';
  }

  console.log('Bytes array length:', bytes.length);

  if (bytes.length === 0) {
    console.error('Empty bytes array');
    return '';
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64Result = btoa(binary);
  console.log('Base64 result length:', base64Result.length);
  console.log('Base64 preview:', base64Result.substring(0, 50) + '...');

  return base64Result;
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

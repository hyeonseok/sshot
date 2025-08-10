import http from 'http';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Default configuration constants
const DEFAULT_PORT = 3000;
const DEFAULT_VIEWPORT_WIDTH = 1920;
const DEFAULT_VIEWPORT_HEIGHT = 1080;
const DEFAULT_DEVICE_SCALE = 1;
const DEFAULT_QUALITY = 80;
const DEFAULT_FULL_PAGE = false;
const DEFAULT_TIMEOUT = 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || DEFAULT_PORT;

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Generate filename function
function generateFilename(customFilename = null) {
  if (customFilename) {
    // If custom filename is provided - check extension and use as is
    const parsed = path.parse(customFilename);
    if (!parsed.ext) {
      // Add .webp if no extension
      return `${customFilename}.webp`;
    }
    // Use as is if extension exists
    return customFilename;
  } else {
    // Use default filename - add timestamp
    const timestamp = Date.now();
    return `screenshot_${timestamp}.webp`;
  }
}

// Screenshot capture function
async function captureScreenshot(url, options = {}) {
  let browser;
  try {
    // Set default options
    const {
      width = DEFAULT_VIEWPORT_WIDTH,
      height = DEFAULT_VIEWPORT_HEIGHT,
      scale = DEFAULT_DEVICE_SCALE,
      quality = DEFAULT_QUALITY,
      fullPage = DEFAULT_FULL_PAGE,
      filename = null
    } = options;

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height),
      deviceScaleFactor: parseFloat(scale),
    });

    // Load page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: DEFAULT_TIMEOUT
    });

    // Generate unique filename
    const finalFilename = generateFilename(filename);
    
    // Take screenshot (WebP format)
    const screenshotPath = path.join(screenshotsDir, finalFilename);
    await page.screenshot({
      path: screenshotPath,
      fullPage: fullPage,
      type: 'webp',
      quality: parseInt(quality)
    });

    return finalFilename;
  } catch (error) {
    console.error('Screenshot capture error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST /api/capture endpoint
  if (req.method === 'POST' && req.url === '/api/capture') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { url, ...options } = JSON.parse(body);
        
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'URL is required' 
          }));
          return;
        }

        // Validate URL
        try {
          new URL(url);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Invalid URL' 
          }));
          return;
        }

        // Validate options
        const { width, height, scale, quality, fullPage, filename } = options;
        
        if (width && (isNaN(width) || width <= 0)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Width must be a positive number' 
          }));
          return;
        }
        
        if (height && (isNaN(height) || height <= 0)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Height must be a positive number' 
          }));
          return;
        }
        
        if (scale && (isNaN(scale) || scale <= 0)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Scale must be a positive number' 
          }));
          return;
        }
        
        if (quality && (isNaN(quality) || quality < 0 || quality > 100)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Quality must be between 0 and 100' 
          }));
          return;
        }
        
        if (fullPage !== undefined && typeof fullPage !== 'boolean') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'FullPage must be a boolean value' 
          }));
          return;
        }

        if (filename && typeof filename !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Filename must be a string' 
          }));
          return;
        }

        // Capture screenshot
        const finalFilename = await captureScreenshot(url, options);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Screenshot captured successfully',
          filename: finalFilename,
          timestamp: Date.now(),
          options: {
            width: options.width || DEFAULT_VIEWPORT_WIDTH,
            height: options.height || DEFAULT_VIEWPORT_HEIGHT,
            scale: options.scale || DEFAULT_DEVICE_SCALE,
            quality: options.quality || DEFAULT_QUALITY,
            fullPage: options.fullPage !== undefined ? options.fullPage : DEFAULT_FULL_PAGE,
            filename: options.filename || null
          }
        }));

      } catch (error) {
        console.error('API error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Error occurred while capturing screenshot',
          details: error.message
        }));
      }
    });
    return;
  }

  // 404 handling
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📸 Screenshot API: http://localhost:${PORT}/api/capture`);
});

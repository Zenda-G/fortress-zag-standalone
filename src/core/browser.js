/**
 * FORTRESS ZAG - Browser Automation Module
 * 
 * Web browser automation using Playwright.
 * Safe, sandboxed browser operations.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Screenshot storage
const SCREENSHOT_DIR = path.join(process.cwd(), 'data', 'screenshots');

function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Check if Playwright is installed
 */
function checkPlaywright() {
  return new Promise((resolve) => {
    const check = spawn('npx', ['playwright', '--version'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    check.stdout.on('data', (data) => { output += data; });
    
    check.on('close', (code) => {
      resolve(code === 0);
    });
    
    check.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Navigate to URL and capture screenshot
 */
async function browserNavigate({ url, screenshot = true, waitFor = 2000 }) {
  ensureScreenshotDir();
  
  const timestamp = Date.now();
  const screenshotPath = path.join(SCREENSHOT_DIR, `nav-${timestamp}.png`);
  
  const script = `
    const { chromium } = require('playwright');
    
    (async () => {
      try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('${url}', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(${waitFor});
        
        ${screenshot ? `await page.screenshot({ path: '${screenshotPath.replace(/\\/g, '\\\\')}', fullPage: true });` : ''}
        
        const title = await page.title();
        const content = await page.content();
        
        // Extract text content
        const text = await page.evaluate(() => {
          return document.body.innerText.substring(0, 10000);
        });
        
        await browser.close();
        
        console.log(JSON.stringify({
          success: true,
          title,
          text: text.substring(0, 5000),
          screenshot: ${screenshot ? `'${screenshotPath}'` : 'null'},
          url: '${url}'
        }));
      } catch (error) {
        console.log(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    })();
  `;
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['-e', script], {
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => { output += data; });
    child.stderr.on('data', (data) => { errorOutput += data; });
    
    child.on('close', (code) => {
      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch {
        resolve({
          success: false,
          error: errorOutput || 'Browser automation failed',
          code
        });
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Click element on page
 */
async function browserClick({ url, selector, waitFor = 2000 }) {
  const script = `
    const { chromium } = require('playwright');
    
    (async () => {
      try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('${url}', { waitUntil: 'networkidle' });
        await page.waitForSelector('${selector}', { timeout: 10000 });
        await page.click('${selector}');
        await page.waitForTimeout(${waitFor});
        
        const title = await page.title();
        const url_after = page.url();
        
        await browser.close();
        
        console.log(JSON.stringify({
          success: true,
          title,
          url: url_after
        }));
      } catch (error) {
        console.log(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    })();
  `;
  
  return new Promise((resolve) => {
    const child = spawn('node', ['-e', script], { timeout: 60000, stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (data) => { output += data; });
    child.on('close', () => {
      try { resolve(JSON.parse(output)); } 
      catch { resolve({ success: false, error: 'Click failed' }); }
    });
  });
}

/**
 * Type text into input field
 */
async function browserType({ url, selector, text, submit = false }) {
  const script = `
    const { chromium } = require('playwright');
    
    (async () => {
      try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('${url}', { waitUntil: 'networkidle' });
        await page.waitForSelector('${selector}', { timeout: 10000 });
        await page.fill('${selector}', '${text.replace(/'/g, "\\'")}');
        
        ${submit ? `await page.press('${selector}', 'Enter');` : ''}
        
        await page.waitForTimeout(2000);
        
        const title = await page.title();
        
        await browser.close();
        
        console.log(JSON.stringify({
          success: true,
          title,
          submitted: ${submit}
        }));
      } catch (error) {
        console.log(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    })();
  `;
  
  return new Promise((resolve) => {
    const child = spawn('node', ['-e', script], { timeout: 60000, stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (data) => { output += data; });
    child.on('close', () => {
      try { resolve(JSON.parse(output)); }
      catch { resolve({ success: false, error: 'Type failed' }); }
    });
  });
}

/**
 * Extract data from page
 */
async function browserExtract({ url, selector }) {
  const script = `
    const { chromium } = require('playwright');
    
    (async () => {
      try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('${url}', { waitUntil: 'networkidle' });
        
        const elements = await page.$$eval('${selector}', els => 
          els.map(el => ({
            text: el.innerText,
            href: el.href || null
          }))
        );
        
        await browser.close();
        
        console.log(JSON.stringify({
          success: true,
          count: elements.length,
          elements: elements.slice(0, 20) // Limit results
        }));
      } catch (error) {
        console.log(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    })();
  `;
  
  return new Promise((resolve) => {
    const child = spawn('node', ['-e', script], { timeout: 60000, stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (data) => { output += data; });
    child.on('close', () => {
      try { resolve(JSON.parse(output)); }
      catch { resolve({ success: false, error: 'Extract failed' }); }
    });
  });
}

module.exports = {
  checkPlaywright,
  browserNavigate,
  browserClick,
  browserType,
  browserExtract,
  SCREENSHOT_DIR
};

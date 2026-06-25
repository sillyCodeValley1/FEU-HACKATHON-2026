import { JSDOM } from 'jsdom';

const BASE_URL = 'https://circuit.rocks';

// We'll just use /collections/all with pagination instead of multiple collections
const BASE_COLLECTION = '/collections/all';

export interface CircuitRocksProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  available: boolean;
  url: string;
  description: string;
}

// In-memory cache for products
let cachedProducts: CircuitRocksProduct[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache

/**
 * Scrapes a single collection page from CircuitRocks
 */
async function scrapeCollection(collectionPath: string, seenUrls: Set<string>): Promise<CircuitRocksProduct[]> {
  const products: CircuitRocksProduct[] = [];
  try {
    const res = await fetch(`${BASE_URL}${collectionPath}`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Get all product links
    const productLinks = [
      ...new Set(
        [...document.querySelectorAll('.vb-product a')]
          .map(a => a.getAttribute('href'))
          .filter(Boolean)
          .map(href => new URL(href!, BASE_URL).href)
      )
    ].filter(url => !seenUrls.has(url));

    console.log(`Found ${productLinks.length} new products`);

    // Fetch each product's details with retry logic
    for (const link of productLinks) {
      seenUrls.add(link);
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          await new Promise(resolve => setTimeout(resolve, 400)); // Longer delay
          const jsonUrl = `${link}.js`;
          const response = await fetch(jsonUrl);

          if (!response.ok) {
            if (response.status === 429) {
              console.log(`Rate limited (429) for ${jsonUrl}, waiting 5 seconds and retrying... (${retries} left)`);
              await new Promise(resolve => setTimeout(resolve, 5000));
              retries--;
              continue;
            }
            console.log(`Failed (${response.status}): ${jsonUrl}`);
            break;
          }

          const product = await response.json();
          const variant = product.variants?.[0] || {};
          
          products.push({
            id: variant.sku || product.id?.toString() || Math.random().toString(36).substr(2, 9),
            name: product.title,
            category: product.type || 'Uncategorized',
            price: variant.price ? Number(variant.price) / 100 : 0,
            stock: variant.inventory_quantity || 0,
            available: variant.available || false,
            url: link,
            description: product.body_html ? stripHtml(product.body_html) : product.type || 'Component'
          });
          success = true;
        } catch (err: any) {
          console.error(`Error for ${link}:`, err.message);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    }
  } catch (err: any) {
    console.error(`Error scraping collection ${collectionPath}:`, err.message);
  }

  return products;
}

/**
 * Formats category names for display
 */
function formatCategory(category: string): string {
  const replacements: Record<string, string> = {
    'arduino-boards-philippines': 'Microcontroller',
    'sensors': 'Sensor',
    'sensors-temp-humidity': 'Sensor',
    'sensors-imu-motion': 'Sensor',
    'sensors-distance': 'Sensor',
    'sensors-light-color': 'Sensor',
    'sensors-air-gas': 'Sensor',
    'breakouts': 'Module',
    'displays': 'Display',
    'led-strips-neopixels': 'LED',
    'audio': 'Audio',
    'robotics-motion-cnc': 'Actuator',
    'power-supply': 'Power',
    'battery': 'Power',
    'cables-connectors': 'Wiring',
    'esp32-esp8266-module-development-board': 'Microcontroller',
    'raspberry-pi-philippines': 'Microcontroller',
    'kits': 'Kit'
  };
  return replacements[category] || category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Strips HTML tags from a string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Fetches all products from CircuitRocks, using cache if available
 */
export async function getCircuitRocksProducts(): Promise<CircuitRocksProduct[]> {
  const now = Date.now();

  // Return cached data if still fresh
  if (cachedProducts.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    console.log('Using cached CircuitRocks product data');
    return cachedProducts;
  }

  console.log('Fetching fresh product data from CircuitRocks...');
  
  // Scrape all pages from /collections/all
  const allProducts: CircuitRocksProduct[] = [];
  const seenUrls = new Set<string>();
  let page = 1;
  
  while (true) {
    const collectionPath = `${BASE_COLLECTION}?page=${page}`;
    console.log(`Scraping page ${page}...`);
    
    const products = await scrapeCollection(collectionPath, seenUrls);
    if (products.length === 0) {
      console.log('No more products found - stopping pagination');
      break;
    }
    
    allProducts.push(...products);
    page++;
    
    // Add a longer delay between pages to be extra polite and avoid 429 errors
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update cache
  cachedProducts = allProducts;
  lastFetchTime = now;

  console.log(`Total products scraped: ${allProducts.length}`);
  return allProducts;
}

/**
 * Initializes the scraper on server startup
 */
export async function initScraper() {
  console.log('Initializing CircuitRocks scraper...');
  try {
    await getCircuitRocksProducts();
    console.log('CircuitRocks product data loaded successfully');
  } catch (err) {
    console.error('Failed to initialize scraper:', err);
  }
}

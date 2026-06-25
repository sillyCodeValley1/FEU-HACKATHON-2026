
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://circuit.rocks';

const COLLECTIONS = [
  '/collections/arduino-boards-philippines',
  '/collections/sensors-philippines',
  '/collections/modules-philippines',
  '/collections/motors-and-actuators',
  '/collections/power-supplies-philippines',
  '/collections/wires-cables-and-connectors',
  '/collections/prototyping-supplies'
];

async function testCollection(collectionPath: string) {
  console.log(`\nTesting: ${collectionPath}`);
  try {
    const res = await fetch(`${BASE_URL}${collectionPath}`);
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Try multiple selectors!
    const selectors = [
      '.vb-product a',
      '.product-item a',
      '.grid-product a',
      '[data-product] a',
      'a[href*="/products/"]'
    ];

    for (const selector of selectors) {
      const links = [...document.querySelectorAll(selector)];
      console.log(`Selector "${selector}": found ${links.length} elements`);
    }

    // Just get all product links!
    const allLinks = [...document.querySelectorAll('a')]
      .map(a => a.getAttribute('href'))
      .filter(href => href && href.includes('/products/'));
    
    console.log(`Total product links found: ${allLinks.length}`);
    console.log('Sample links:', allLinks.slice(0, 3));

  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

// Test all collections!
async function main() {
  for (const col of COLLECTIONS) {
    await testCollection(col);
  }
}

main();

const { JSDOM } = require("jsdom");
const { COLLECTIONS } = require("./collections.js");

console.log("========================================");
console.log("  CircuitRocks Data Scraper Starting...");
console.log("========================================\n");

const BASE_URL = "https://circuit.rocks";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract all product URLs from a collection page
 */
async function getProductLinks(collectionPath) {
  await delay(1000); // 1s delay to respect rate limits
  const response = await fetch(
    `${BASE_URL}${collectionPath}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load collection (${response.status}): ${collectionPath}`
    );
  }

  const html = await response.text();
  const document = new JSDOM(html).window.document;

  const links = [
    ...new Set(
      [...document.querySelectorAll(".vb-product a")]
        .map(link => link.getAttribute("href"))
        .filter(Boolean)
        .map(href => new URL(href, BASE_URL).href)
    ),
  ];
  return links;
}

/**
 * Fetch product information from Shopify's .js endpoint
 */
async function getProductData(productUrl) {
  try {
    const response = await fetch(`${productUrl}.js`);

    if (!response.ok) {
      console.warn(
        `   ❌ Failed to fetch (${response.status}): ${productUrl}.js`
      );
      return null;
    }

    const product = await response.json();
    console.log(
      `   ✅ Fetched: "${product.title}" (${product.variants.length} variants)`
    );

    return product.variants.map(variant => ({
      title: product.title,
      sku: variant.sku ?? null,
      variant: variant.title,
      price:
        typeof variant.price === "number"
          ? variant.price / 100
          : null,
      stock: variant.inventory_quantity ?? null,
      available: variant.available ?? false,
      url: productUrl,
    }));
  } catch (error) {
    console.error(
      `   ❌ Error fetching ${productUrl}:`,
      error.message
    );
    return null;
  }
}

/**
 * Scrape a single collection
 */
async function scrapeCollection(collectionPath) {
  console.log(`\n[Processing] Collection: ${collectionPath}`);

  const productLinks = await getProductLinks(
    collectionPath
  );

  console.log(`   🔍 Found ${productLinks.length} product links`);
  console.log(`   📥 Fetching product details...`);

  const products = await Promise.all(
    productLinks.map(getProductData)
  );

  const validProducts = products
    .filter(Boolean)
    .flat();
  
  console.log(`   ✅ Successfully processed ${validProducts.length} product variants from this collection`);

  return validProducts;
}

/**
 * Scrape all collections
 */
async function scrapeAllCollections() {
  const startTime = Date.now();
  const stats = {
    totalCollections: 0,
    processedCollections: 0,
    failedCollections: 0,
    totalProducts: 0,
    uniqueProducts: 0,
    productsWithSku: 0,
    productsWithoutSku: 0,
  };

  try {
    let collections = COLLECTIONS;
    stats.totalCollections = collections.length;

    console.log(`✅ Loaded ${collections.length} collections from collections.js`);
    console.log(`[Processing] Starting to scrape all collections\n`);

    const allProducts = [];
    const seenSkus = new Set();

    for (const collection of collections) {
      try {
        const products = await scrapeCollection(
          collection
        );
        stats.processedCollections++;

        for (const product of products) {
          stats.totalProducts++;
          
          if (
            product.sku &&
            seenSkus.has(product.sku)
          ) {
            continue;
          }

          if (product.sku) {
            seenSkus.add(product.sku);
            stats.productsWithSku++;
          } else {
            stats.productsWithoutSku++;
          }

          allProducts.push(product);
        }
      } catch (error) {
        stats.failedCollections++;
        console.error(
          `   ❌ Failed to process collection ${collection}:`,
          error.message
        );
      }
    }

    stats.uniqueProducts = allProducts.length;

    console.log("\n========================================");
    console.log("  Scrape Complete!");
    console.log("========================================");
    console.log("\n📊 Scraper Statistics:");
    console.log(`   • Collections Found: ${stats.totalCollections}`);
    console.log(`   • Collections Successfully Processed: ${stats.processedCollections}`);
    console.log(`   • Collections Failed: ${stats.failedCollections}`);
    console.log(`   • Total Product Variants Found: ${stats.totalProducts}`);
    console.log(`   • Unique Product Variants Saved: ${stats.uniqueProducts}`);
    console.log(`   • Products with SKU: ${stats.productsWithSku}`);
    console.log(`   • Products without SKU: ${stats.productsWithoutSku}`);
    
    const fs = require('fs');
    const path = require('path');
    const catalogPath = path.join(__dirname, 'catalog.json');
    fs.writeFileSync(catalogPath, JSON.stringify(allProducts, null, 2));
    console.log(`\n💾 Catalog saved successfully to: ${catalogPath}`);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\n⏱️  Total time taken: ${duration.toFixed(2)} seconds`);
    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ Fatal error during scraping:", error);
  }
}

scrapeAllCollections();
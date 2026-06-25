const { JSDOM } = require("jsdom");

const BASE_URL = "https://circuit.rocks";

/**
 * Get all collections from Shopify
 */
async function getCollections() {
  const response = await fetch(
    `${BASE_URL}/collections.json?limit=250`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load collections (${response.status})`
    );
  }

  const { collections } = await response.json();

  return collections.map(
    collection => `/collections/${collection.handle}`
  );
}

/**
 * Extract all product URLs from a collection page
 */
async function getProductLinks(collectionPath) {
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

  return [
    ...new Set(
      [...document.querySelectorAll(".vb-product a")]
        .map(link => link.getAttribute("href"))
        .filter(Boolean)
        .map(href => new URL(href, BASE_URL).href)
    ),
  ];
}

/**
 * Fetch product information from Shopify's .js endpoint
 */
async function getProductData(productUrl) {
  try {
    const response = await fetch(`${productUrl}.js`);

    if (!response.ok) {
      console.warn(
        `Failed (${response.status}): ${productUrl}.js`
      );
      return null;
    }

    const product = await response.json();

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
      `Error fetching ${productUrl}:`,
      error.message
    );
    return null;
  }
}

/**
 * Scrape a single collection
 */
async function scrapeCollection(collectionPath) {
  console.log(`\nScraping ${collectionPath}`);

  const productLinks = await getProductLinks(
    collectionPath
  );

  console.log(
    `Found ${productLinks.length} products`
  );

  const products = await Promise.all(
    productLinks.map(getProductData)
  );

  return products
    .filter(Boolean)
    .flat();
}

/**
 * Scrape all collections
 */
async function scrapeAllCollections() {
  try {
    const collections = await getCollections();

    console.log(
      `Found ${collections.length} collections`
    );

    const allProducts = [];
    const seenSkus = new Set();

    for (const collection of collections) {
      try {
        const products = await scrapeCollection(
          collection
        );

        for (const product of products) {
          if (
            product.sku &&
            seenSkus.has(product.sku)
          ) {
            continue;
          }

          if (product.sku) {
            seenSkus.add(product.sku);
          }

          allProducts.push(product);
        }
      } catch (error) {
        console.error(
          `Failed collection ${collection}:`,
          error.message
        );
      }
    }

    console.log(
      `\nTotal Unique Products: ${allProducts.length}`
    );

    console.log(
      JSON.stringify(allProducts, null, 2)
    );
  } catch (error) {
    console.error(error);
  }
}

scrapeAllCollections();
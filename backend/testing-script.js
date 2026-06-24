const { JSDOM } = require("jsdom");

const BASE_URL = "https://circuit.rocks";

async function scrapeCollection() {
  const res = await fetch(
    `${BASE_URL}/collections/arduino-boards-philippines`
  );

  const html = await res.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const productLinks = [
    ...new Set(
      [...document.querySelectorAll(".vb-product a")]
        .map(a => a.getAttribute("href"))
        .filter(Boolean)
        .map(href => new URL(href, BASE_URL).href)
    )
  ];

  console.log(`Found ${productLinks.length} products`);

  const products = [];

  for (const link of productLinks) {
    try {
      const jsonUrl = `${link}.js`;

      console.log(`Fetching: ${jsonUrl}`);

      const response = await fetch(jsonUrl);

      if (!response.ok) {
        console.log(`Failed (${response.status}): ${jsonUrl}`);
        continue;
      }

      const product = await response.json();
      const variant = product.variants?.[0] || {};

      products.push({
        title: product.title,
        sku: variant.sku,
        price: variant.price ? Number(variant.price) / 100 : null,
        stock: variant.inventory_quantity,
        available: variant.available,
        url: link,
      });
    } catch (err) {
      console.error(`Error for ${link}:`, err.message);
    }
  }

  console.log(JSON.stringify(products, null, 2));
}

scrapeCollection();
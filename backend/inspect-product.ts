
async function inspectProduct() {
  try {
    // Pick any product URL from what we scraped before!
    const res = await fetch('https://circuit.rocks/products/arduino-uno-r3-ch340.js');
    const product = await res.json();
    console.log('Product data:', JSON.stringify(product, null, 2));
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

inspectProduct();

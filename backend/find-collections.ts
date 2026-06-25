
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://circuit.rocks';

async function findCollections() {
  try {
    const res = await fetch(BASE_URL);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const allLinks = [...document.querySelectorAll('a')]
      .map(a => a.getAttribute('href'))
      .filter(href => href && href.includes('/collections/'));

    const uniqueCollections = [...new Set(allLinks)];
    console.log('Found collections:', uniqueCollections);

  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

findCollections();

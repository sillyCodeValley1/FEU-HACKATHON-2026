
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://circuit.rocks';

async function checkPagination() {
  try {
    const res = await fetch(`${BASE_URL}/collections/all`);
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Look for pagination links
    console.log('Looking for pagination elements:');
    const pagination = document.querySelectorAll('[class*="pagination"], [class*="pager"], nav a');
    pagination.forEach(el => console.log(' -', el.textContent, el.getAttribute('href')));

    // Also check for load more buttons
    console.log('\nLooking for load more buttons:');
    const loadMore = document.querySelectorAll('[class*="load"], [class*="more"], button');
    loadMore.forEach(el => console.log(' -', el.textContent));

    // Check how many products are on the first page
    console.log('\nProducts on page 1:', document.querySelectorAll('.vb-product').length);

  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

checkPagination();

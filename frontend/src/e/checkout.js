// Listen to all clicks on the document
document.addEventListener('click', function(event) {

  // Check if the clicked element (or its closest parent) matches your button's classes
  const targetButton = event.target.closest('.w-full.bg-primary.hover\\:bg-primary-dark.disabled\\:bg-gray-700.disabled\\:text-gray-400.text-white.rounded-lg.py-2\\.5.text-sm.font-medium.transition-colors.flex.items-center.justify-center.gap-2.shadow-lg.shadow-primary\\/20');

  // If it doesn't match, ignore the click completely
  if (!targetButton) {
    return;
  }

  // --- Your extraction and redirection logic runs here when the button IS clicked ---

  // 1. Grab the project name
  const projectElement = document.querySelector('.w-full.flex.items-center.rounded-lg.transition-all.duration-200.text-sm.font-medium.relative.overflow-hidden.justify-between.px-3.py-2\\.5.bg-primary\\/10.text-primary');
  const projectName = projectElement ? projectElement.innerText.trim() : 'Project';

  // 2. Select all SKU elements
  const elements = document.querySelectorAll('.font-mono.text-\\[10px\\].text-text-muted');

  // 3. Extract, filter, and clean the SKUs
  const cleanSkus = Array.from(elements)
    .map(function(el) {
      return el.innerText.trim();
    })
    .filter(function(text) {
      return text.startsWith('SKU: ');
    })
    .map(function(text) {
      return text.replace('SKU: ', '');
    });

  // 4. Format the string
  const formattedBomString = '# ' + projectName + '\n' + cleanSkus.join('\n');

  // 5. Run the circuitrock checkout logic inline
  if (!formattedBomString || !formattedBomString.trim()) {
    showToast('paste a BOM first', true);
    return;
  }

  var trimmedText = formattedBomString.trim();
  var enc = btoa(unescape(encodeURIComponent(trimmedText)));
  var targetUrl = 'https://circuit.rocks/pages/bom-builder?bom=' + enc;

  window.open(targetUrl, '_blank');
});

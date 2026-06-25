function gatherSkus() {
  // 1. Target the specific panel elements
  const panels = document.querySelectorAll('.bg-bg-panel.border.rounded-lg.p-3.shadow-sm.relative.overflow-hidden.transition-all.border-primary\\/50');
  const skus = [];

  panels.forEach(function(panel) {
    // 2. Skip this panel if it has the excluded class
    if (panel.classList.contains('order-border-dark')) {
      return;
    }

    // 3. Find the SKU elements strictly inside this specific panel
    const skuElements = panel.querySelectorAll('.font-mono.text-\\[10px\\].text-text-muted');

    skuElements.forEach(function(el) {
      const text = el.innerText.trim();

      // 4. Validate prefix and clean it up
      if (text.startsWith('SKU: ')) {
        skus.push(text.replace('SKU: ', ''));
      }
    });
  });

  return skus;
}

// Listen to all clicks on the document
document.addEventListener('click', function(event) {

  // Check if the clicked element (or its closest parent) matches your button's classes
  const targetButton = event.target.closest('.w-full.bg-primary.hover\\:bg-primary-dark.disabled\\:bg-gray-700.disabled\\:text-gray-400.text-white.rounded-lg.py-2\\.5.text-sm.font-medium.transition-colors.flex.items-center.justify-center.gap-2.shadow-lg.shadow-primary\\/20');

  if (!targetButton) {
    return;
  }

  // 1. Grab the project name
  const projectElement = document.querySelector('.w-full.flex.items-center.rounded-lg.transition-all.duration-200.text-sm.font-medium.relative.overflow-hidden.justify-between.px-3.py-2\\.5.bg-primary\\/10.text-primary');
  const projectName = projectElement ? projectElement.innerText.trim() : 'Project';

  // 2. Gather the clean SKUs using the new helper function
  const cleanSkus = gatherSkus();

  // 3. Format the string
  const formattedBomString = '# ' + projectName + '\n' + cleanSkus.join('\n');

  // 4. Run the circuitrock checkout logic inline
  if (!formattedBomString || !formattedBomString.trim()) {
    showToast('paste a BOM first', true);
    return;
  }

  var trimmedText = formattedBomString.trim();
  console.log(trimmedText);
  var enc = btoa(unescape(encodeURIComponent(trimmedText)));
  console.log(enc);
  var targetUrl = 'https://circuit.rocks/pages/bom-builder?bom=' + enc;

  window.open(targetUrl, '_blank');
});

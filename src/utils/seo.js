export function setSEO({ title, description }) {
  if (typeof document === 'undefined') return;
  try {
    if (title) {
      document.title = title;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', title);
    }
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', description);
    }
  } catch (e) {
    // noop
  }
}

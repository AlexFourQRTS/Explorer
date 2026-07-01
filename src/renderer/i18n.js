let localeStrings = {};

async function loadLocale(languageCode) {
  const response = await fetch(`./src/locales/${languageCode}.json`);
  localeStrings = await response.json();
  applyLocaleToDocument();
}

function translateText(key) {
  return localeStrings[key] || key;
}

function applyLocaleToDocument() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    element.textContent = translateText(key);
  });
}

window.streemI18n = {
  loadLocale,
  translateText,
};

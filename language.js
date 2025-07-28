/**
 * Achieved using https://medium.com/@nohanabil/building-a-multilingual-static-website-a-step-by-step-guide-7af238cc8505
 */

function updateContent(langData) {
    document.querySelectorAll('[data-i18n]').forEach(element=> {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = langData[key];
    })
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = langData[key] || "";
    });

    document.querySelectorAll('[data-i18n-value]').forEach(element => {
    const key = element.getAttribute('data-i18n-value');
    element.value = langData[key] || "";
    });
}

function setLanguagePreference(lang) {
    localStorage.setItem('language', lang);
    location.reload();
}

async function fetchLanguageData(lang) {
    const response = await fetch(`language_content/${lang}.json`);
    return response.json();
}

async function changeLanguage(lang) {
    setLanguagePreference(lang);

    const langData = await fetchLanguageData(lang);
    updateContent(langData);
}

window.addEventListener('DOMContentLoaded', async () => {
    const currentLang = localStorage.getItem('language') || 'fr';
    const langData = await fetchLanguageData(currentLang);
    updateContent(langData);

    const toggleBtn = document.getElementById('langToggle');
    const otherLang = currentLang === 'en' ? 'fr' : 'en';
    toggleBtn.textContent = otherLang === 'en' ? 'English' : 'Français';
    toggleBtn.onclick = () => changeLanguage(otherLang);
})
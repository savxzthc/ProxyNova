(() => {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('site-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!isOpen));
            menu.classList.toggle('is-open', !isOpen);
        });
    }

    const page = document.documentElement.dataset.page;
    const currentMap = {
        home: 'index.html',
        features: 'features.html',
        download: 'download.html',
        docs: 'docs.html',
        faq: 'faq.html',
        privacy: 'privacy.html',
        security: 'security.html'
    };
    const currentHref = currentMap[page];
    if (currentHref) {
        document.querySelectorAll('.nav-links a, .site-footer a').forEach((link) => {
            if (link.getAttribute('href') === currentHref) {
                link.setAttribute('aria-current', 'page');
            }
        });
    }
})();

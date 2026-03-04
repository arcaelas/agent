// Scripts personalizados para Arcaelas Agent Documentation

// Gestión de idioma basado en pathname
(function() {
  const get_current_lang = () => {
    const path = window.location.pathname;
    if (path.includes('/es/')) return 'es';
    if (path.includes('/de/')) return 'de';
    return 'en';
  };

  const update_lang_links = () => {
    const current_lang = get_current_lang();
    const lang_links = document.querySelectorAll('.md-header__option a');

    lang_links.forEach(link => {
      const href = link.getAttribute('href');
      const current_path = window.location.pathname.replace(/^\/(agent\/)?(es|de)?\/?/, '');

      if (href.includes('/es/')) {
        link.setAttribute('href', '/agent/es/' + current_path);
      } else if (href.includes('/de/')) {
        link.setAttribute('href', '/agent/de/' + current_path);
      } else if (!href.includes('/es/') && !href.includes('/de/')) {
        link.setAttribute('href', '/agent/' + current_path);
      }
    });
  };

  // Actualizar enlaces de idioma al cargar la página
  document.addEventListener('DOMContentLoaded', update_lang_links);

  // Actualizar enlaces después de navegación SPA
  if (window.location$ !== undefined) {
    window.location$.subscribe(update_lang_links);
  }
})();

// Agregar iconos a enlaces externos
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(link => {
    if (!link.hostname.includes('arcaelas.github.io')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
});

// Smooth scroll para anchors internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Copiar código con feedback visual mejorado
if (navigator.clipboard) {
  document.addEventListener('DOMContentLoaded', function() {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      block.addEventListener('copy', function() {
        const button = block.parentElement.querySelector('button');
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✓ Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      });
    });
  });
}

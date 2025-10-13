// Scripts personalizados para Arcaelas Agent Documentation

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

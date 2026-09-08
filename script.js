const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pageMain = document.querySelector('main');

if (pageMain && !prefersReducedMotion) {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    let url;
    try { url = new URL(link.href, window.location.href); } catch { return; }
    if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    event.preventDefault();
    pageMain.classList.add('is-leaving');
    window.setTimeout(() => { window.location.href = link.href; }, 200);
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) pageMain.classList.remove('is-leaving');
  });
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    const payload = {
      name: document.getElementById('contactName').value,
      email: document.getElementById('contactEmail').value,
      organisation: document.getElementById('contactOrg').value,
      stage: document.getElementById('contactStage')?.value || '',
      message: document.getElementById('contactMessage').value,
      company_website: document.getElementById('contactHoneypot').value,
    };

    if (submitBtn) submitBtn.disabled = true;
    if (status) status.textContent = 'Sending…';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({ ok: false }));

      if (response.ok && result.ok) {
        if (status) status.textContent = 'Thank you — your enquiry has been sent. We will be in touch soon.';
        contactForm.reset();
      } else if (status) {
        status.textContent = result.error || 'Something went wrong. Please email admin@gavriqlabsglobal.com directly.';
      }
    } catch {
      if (status) status.textContent = 'Something went wrong. Please email admin@gavriqlabsglobal.com directly.';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

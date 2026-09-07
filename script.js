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

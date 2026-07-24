/* Essa's Solar — shared behavior */
(function () {
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? '×' : '☰';
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = '☰';
      });
    });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('on'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // stagger siblings that enter together
          var el = entry.target;
          var sibs = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [el];
          var idx = Array.prototype.indexOf.call(sibs, el);
          el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms';
          el.classList.add('on');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { observer.observe(el); });
  }

  // Scroll progress bar + nav intensify
  if (!reduce) {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    var navEl = document.querySelector('nav.site-nav');
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
        if (navEl) { navEl.classList.toggle('scrolled', h.scrollTop > 24); }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Set this to your deployed Cloudflare Worker URL to enable silent, background
  // email delivery via Resend. Leave empty to use the pre-filled-email fallback.
  var CONTACT_ENDPOINT = "";

  var form = document.getElementById('consultationForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) { return; }

      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var payload = {
        name: v('name'), company: v('company'), email: v('email'),
        phone: v('phone'), service: v('service'), message: v('message'),
        company_url: v('company_url') // honeypot
      };

      var ok = document.getElementById('formSuccess');
      var btn = form.querySelector('button[type="submit"]');

      function fallbackToMail() {
        var lines = [
          'New consultation request from the Essa’s Solar website:', '',
          'Name: ' + (payload.name || '—'),
          'Company: ' + (payload.company || '—'),
          'Email: ' + (payload.email || '—'),
          'Phone: ' + (payload.phone || '—'),
          'Primary need: ' + (payload.service || '—'), '',
          'Project details:', (payload.message || '—')
        ];
        var mailto = 'mailto:stayez.j@gmail.com'
          + '?subject=' + encodeURIComponent('Solar inspection inquiry' + (payload.name ? ' — ' + payload.name : ''))
          + '&body=' + encodeURIComponent(lines.join('\n'));
        if (ok) { ok.style.display = 'block'; }
        if (btn) { btn.textContent = 'Opening your email…'; }
        window.location.href = mailto;
      }

      function showSent() {
        if (ok) {
          ok.textContent = 'Thank you — your request has been sent to our team. We’ll be in touch shortly, usually within one business day.';
          ok.style.display = 'block';
        }
        if (btn) { btn.textContent = 'Request sent ✓'; btn.disabled = true; }
        form.reset();
      }

      if (!CONTACT_ENDPOINT) { fallbackToMail(); return; }

      if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (r.ok) { showSent(); }
        else { if (btn) { btn.disabled = false; } fallbackToMail(); }
      }).catch(function () {
        if (btn) { btn.disabled = false; }
        fallbackToMail();
      });
    });
  }

  var yr = document.getElementById('year');
  if (yr) { yr.textContent = new Date().getFullYear(); }
})();

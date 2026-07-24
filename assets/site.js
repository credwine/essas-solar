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
      entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add('on'); });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { observer.observe(el); });
  }

  var form = document.getElementById('consultationForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) { return; }

      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var name = v('name'), company = v('company'), email = v('email'),
          phone = v('phone'), service = v('service'), message = v('message');

      var subject = 'Solar inspection inquiry' + (name ? ' — ' + name : '');
      var lines = [
        'New consultation request from the Essa’s Solar website:',
        '',
        'Name: ' + (name || '—'),
        'Company: ' + (company || '—'),
        'Email: ' + (email || '—'),
        'Phone: ' + (phone || '—'),
        'Primary need: ' + (service || '—'),
        '',
        'Project details:',
        (message || '—')
      ];
      var mailto = 'mailto:stayez.j@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(lines.join('\n'));

      var ok = document.getElementById('formSuccess');
      if (ok) { ok.style.display = 'block'; }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Opening your email…'; }

      window.location.href = mailto;
    });
  }

  var yr = document.getElementById('year');
  if (yr) { yr.textContent = new Date().getFullYear(); }
})();

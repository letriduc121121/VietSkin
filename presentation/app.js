/* ════════════════════════════════════════════════════════
   VietSkin Presentation — app.js
════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ── */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile hamburger ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // Close menu on nav link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  /* ── Active nav link on scroll ── */
  const sections  = document.querySelectorAll('section[id]');
  const navItems  = document.querySelectorAll('.nav-links a');
  const observer  = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navItems.forEach(a => {
          a.style.background = '';
          a.style.color = '';
        });
        const active = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (active) {
          active.style.background = 'var(--primary-light)';
          active.style.color = 'var(--primary)';
        }
      }
    });
  }, { threshold: 0.45, rootMargin: '-60px 0px -40% 0px' });
  sections.forEach(s => observer.observe(s));

  /* ── Role tabs ── */
  const tabs   = document.querySelectorAll('.role-tab');
  const panels = document.querySelectorAll('.role-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const role = tab.dataset.role;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panels.forEach(p => {
        p.classList.remove('active');
        if (p.id === `panel-${role}`) p.classList.add('active');
      });
    });
  });

  /* ── Scroll reveal ── */
  const revealEls = document.querySelectorAll(
    '.ov-card, .feature-item, .wf-step, .mod-card, .tech-item, .arch-box, .walkin-box'
  );
  revealEls.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger delay based on sibling index
        const siblings = Array.from(entry.target.parentElement?.children ?? []);
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(idx * 60, 300)}ms`;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── Animated counter for hero stats ── */
  const counterEls = document.querySelectorAll('.stat-num');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el   = entry.target;
      const raw  = el.textContent.replace(/\D/g, '');
      const end  = parseInt(raw, 10);
      const suffix = el.textContent.replace(/\d/g, '').trim();
      if (isNaN(end)) return;

      let start = 0;
      const duration = 1000;
      const step = 16;
      const increment = end / (duration / step);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          el.textContent = end + suffix;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(start) + suffix;
        }
      }, step);

      counterObserver.unobserve(el);
    });
  }, { threshold: 1 });
  counterEls.forEach(el => counterObserver.observe(el));

  /* ── Workflow step highlight on hover ── */
  document.querySelectorAll('.wf-step').forEach(step => {
    step.addEventListener('mouseenter', () => {
      step.querySelector('.wf-bubble').style.transform = 'scale(1.12)';
      step.querySelector('.wf-bubble').style.transition = 'transform .2s';
    });
    step.addEventListener('mouseleave', () => {
      step.querySelector('.wf-bubble').style.transform = 'scale(1)';
    });
  });

  /* ── Smooth active section highlight in workflow ── */
  const wfSteps = document.querySelectorAll('.wf-step');
  let currentHighlight = -1;
  function cycleWorkflow() {
    if (!document.getElementById('workflow')) return;
    currentHighlight = (currentHighlight + 1) % wfSteps.length;
    wfSteps.forEach((step, i) => {
      const bubble = step.querySelector('.wf-bubble');
      if (i === currentHighlight) {
        bubble.style.boxShadow = '0 0 0 6px rgba(37,99,235,.25), 0 6px 20px rgba(37,99,235,.4)';
      } else {
        bubble.style.boxShadow = '0 6px 20px rgba(37,99,235,.35)';
      }
    });
  }
  setInterval(cycleWorkflow, 1800);

  /* ── Module card accent color on hover ── */
  const modColors = [
    '#eff6ff','#f0fdf4','#fefce8','#faf5ff',
    '#fff7ed','#f0f9ff','#fdf4ff','#f0fdfa',
    '#fff7ed','#fef2f2'
  ];
  document.querySelectorAll('.mod-card').forEach((card, i) => {
    card.addEventListener('mouseenter', () => {
      card.style.borderTopColor = 'var(--primary)';
      card.style.borderTopWidth = '3px';
      card.style.background = modColors[i % modColors.length];
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderTopColor = '';
      card.style.borderTopWidth = '';
      card.style.background = '';
    });
  });

  /* ── Tech item hover ripple ── */
  document.querySelectorAll('.tech-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = 'var(--primary-light)';
      const icon = item.querySelector('.tech-icon');
      if (icon) {
        icon.style.transform = 'scale(1.2) rotate(-5deg)';
        icon.style.transition = 'transform .2s';
      }
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = '';
      const icon = item.querySelector('.tech-icon');
      if (icon) icon.style.transform = '';
    });
  });

  /* ── Feature item left-border accent ── */
  const roleColors = {
    patient: '#3b82f6',
    receptionist: '#22c55e',
    doctor: '#f59e0b',
    admin: '#8b5cf6'
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const role = tab.dataset.role;
      const color = roleColors[role] ?? 'var(--primary)';
      const panel = document.getElementById(`panel-${role}`);
      if (!panel) return;
      panel.querySelectorAll('.feature-item').forEach(fi => {
        fi.style.borderLeft = `3px solid ${color}`;
      });
    });
  });
  // Apply to default active (patient)
  document.querySelectorAll('#panel-patient .feature-item').forEach(fi => {
    fi.style.borderLeft = `3px solid ${roleColors.patient}`;
  });

  /* ── Back-to-top on logo click ── */
  document.querySelector('.nav-logo')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── Tooltip on status badges ── */
  const statusDesc = {
    pending:    'Chờ xác nhận từ lễ tân',
    confirmed:  'Lễ tân đã xác nhận',
    checked_in: 'Bệnh nhân đã check-in tại phòng khám',
    in_progress:'Đang được khám bởi bác sĩ',
    done:       'Hoàn thành — chờ thanh toán'
  };
  document.querySelectorAll('.wf-status').forEach(el => {
    const key = el.textContent.trim().replace('-', '_');
    if (statusDesc[key]) {
      el.title = statusDesc[key];
      el.style.cursor = 'help';
    }
  });

  /* ── Parallax on hero blobs ── */
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - .5) * 30;
    const y = (e.clientY / window.innerHeight - .5) * 30;
    const b1 = document.querySelector('.b1');
    const b2 = document.querySelector('.b2');
    const b3 = document.querySelector('.b3');
    if (b1) b1.style.transform = `translate(${x * .8}px, ${y * .8}px)`;
    if (b2) b2.style.transform = `translate(${-x * .5}px, ${-y * .5}px)`;
    if (b3) b3.style.transform = `translate(${x * .3}px, ${y * .3}px)`;
  });

});

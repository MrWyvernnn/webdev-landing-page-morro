(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js-ready");

  // --- Parallax for hero art (desktop only, respects reduced motion) ---
  function initializeParallax() {
    const prefersReduced = window.matchMedia(‘(prefers-reduced-motion: reduce)’).matches;
    const isMobile = window.matchMedia(‘(max-width: 768px)’).matches;
    if (prefersReduced || isMobile) return;

    const clockScene = document.querySelector(‘.clock-scene’);
    const phoneCard = document.querySelector(‘.phone-card’);
    const sunDisc = document.querySelector(‘.sun-disc’);
    const stickyNote = document.querySelector(‘.sticky-note’);
    const orbits = document.querySelectorAll(‘.orbit’);

    if (!clockScene) return;

    let ticking = false;
    function updateParallax() {
      const scrollY = window.scrollY;
      const hero = document.querySelector(‘.hero’);
      if (!hero) { ticking = false; return; }
      const heroRect = hero.getBoundingClientRect();
      const heroCenter = heroRect.top + heroRect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = (viewportCenter - heroCenter) / viewportCenter; // -1 to 1

      if (Math.abs(distance) > 1.5) { ticking = false; return; }

      const factor = distance * 30; // max 30px movement
      if (phoneCard) phoneCard.style.transform = `translateX(-48%) rotate(-3deg) translateY(${factor * 0.3}px)`;
      if (sunDisc) sunDisc.style.transform = `translateY(${factor * 0.2}px)`;
      if (stickyNote) stickyNote.style.transform = `rotate(6deg) translateY(${factor * 0.4}px)`;
      orbits.forEach((orbit, i) => {
        orbit.style.transform = `translateX(-50%) rotate(${i === 0 ? -22 : 53}deg) translateY(${factor * 0.15 * (i + 1)}px)`;
      });

      ticking = false;
    }

    window.addEventListener(‘scroll’, () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });
  }

  // --- Smooth scroll for anchor links ---
  function initializeSmoothScroll() {
    document.querySelectorAll(‘a[href^="#"]’).forEach(anchor => {
      anchor.addEventListener(‘click’, function(e) {
        const targetId = this.getAttribute(‘href’);
        if (targetId === ‘#’) return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight = document.querySelector(‘.site-header’)?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({ top: targetPosition, behavior: ‘smooth’ });
        }
      });
    });
  }

  // --- Enhanced button ripple effect ---
  function initializeButtonRipple() {
    document.querySelectorAll(‘.button, .text-link, .gate-tab, .waitlist-form__submit’).forEach(btn => {
      btn.addEventListener(‘click’, function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement(‘span’);
        ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transform: scale(0);
          animation: ripple 0.4s ease-out;
          pointer-events: none;
          left: ${e.clientX - rect.left}px;
          top: ${e.clientY - rect.top}px;
          width: ${Math.max(rect.width, rect.height)}px;
          height: ${Math.max(rect.width, rect.height)}px;
          margin-left: -${Math.max(rect.width, rect.height) / 2}px;
          margin-top: -${Math.max(rect.width, rect.height) / 2}px;
        `;
        this.style.position = ‘relative’;
        this.style.overflow = ‘hidden’;
        this.appendChild(ripple);
        ripple.addEventListener(‘animationend’, () => ripple.remove());
      });
    });

    // Add ripple keyframes if not exists
    if (!document.querySelector(‘#ripple-styles’)) {
      const style = document.createElement(‘style’);
      style.id = ‘ripple-styles’;
      style.textContent = `
        @keyframes ripple {
          to { transform: scale(2.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // --- Keyboard navigation for hero actions ---
  function initializeKeyboardNav() {
    document.addEventListener(‘keydown’, (e) => {
      if (e.key === ‘Enter’ || e.key === ‘ ‘) {
        const active = document.activeElement;
        if (active.classList.contains(‘text-link’) || active.classList.contains(‘button’)) {
          e.preventDefault();
          active.click();
        }
      }
    });
  }

  // --- Intersection Observer for scroll reveals ---
  function initializeReveals() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    targets.forEach((target) => observer.observe(target));
  }

  // --- Scroll progress bar ---
  function initializeScrollProgress() {
    const progress = document.getElementById("scrollProgress");
    if (!progress) return;

    let queued = false;
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const amount = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      progress.style.transform = `scaleX(${amount})`;
      queued = false;
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
  }

  // --- Gate tabs ---
  function initializeGateTabs() {
    const tabs = Array.from(document.querySelectorAll(".gate-tab[role=’tab’]"));
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
    if (!tabs.length || panels.some((panel) => !panel)) return;

    function activate(index, moveFocus = false) {
      const nextIndex = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === nextIndex;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[tabIndex].hidden = !selected;
        if (selected) {
          panels[tabIndex].setAttribute(‘data-reveal’, ‘’);
          panels[tabIndex].classList.remove(‘is-visible’);
          // Force reflow for animation
          void panels[tabIndex].offsetWidth;
          panels[tabIndex].classList.add(‘is-visible’);
        }
      });
      if (moveFocus) tabs[nextIndex].focus();
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index));
      tab.addEventListener("keydown", (event) => {
        let nextIndex;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(nextIndex, true);
      });
    });

    // Touch swipe for tabs on mobile
    let touchStartX = 0;
    const tabContainer = document.querySelector(‘.gate-tabs’);
    if (tabContainer) {
      tabContainer.addEventListener(‘touchstart’, (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      tabContainer.addEventListener(‘touchend’, (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          const activeIndex = tabs.findIndex(t => t.classList.contains(‘is-active’));
          if (diff > 0) activate((activeIndex + 1) % tabs.length);
          else activate((activeIndex - 1 + tabs.length) % tabs.length);
        }
      }, { passive: true });
    }
  }

  // --- Privacy dialog ---
  function initializePrivacyDialog() {
    const email = document.getElementById("beta-email");
    const dialog = document.getElementById("privacyModal");
    const acceptButton = document.getElementById("privacyAcceptBtn");
    const declineButton = document.getElementById("privacyDeclineBtn");
    const captureSection = document.getElementById("waitlist");
    if (!email || !dialog || !acceptButton || !declineButton) {
      return { isAccepted: () => true, openDialog: () => {} };
    }

    let acceptedThisPage = false;
    let previousFocus = null;
    let focusGuardActive = false;

    function isAccepted() {
      if (acceptedThisPage) return true;
      try {
        return window.localStorage.getItem("morro_privacy_accepted") === "true";
      } catch {
        return false;
      }
    }

    function focusableElements() {
      return Array.from(dialog.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex=’-1’])"))
        .filter((element) => element.getAttribute("aria-hidden") !== "true");
    }

    function keepFocusInside(event) {
      if (dialog.getAttribute("aria-hidden") === "true" || dialog.contains(event.target)) return;
      const focusables = focusableElements();
      (focusables[0] || dialog).focus();
    }

    function handleDialogKeydown(event) {
      if (dialog.getAttribute("aria-hidden") === "true") return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = focusableElements();
      if (!focusables.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function openDialog() {
      if (isAccepted() || dialog.classList.contains("active")) return;
      previousFocus = captureSection || document.activeElement;
      email.readOnly = true;
      email.blur();
      dialog.classList.add("active");
      dialog.setAttribute("aria-hidden", "false");
      document.body.classList.add("dialog-open");
      if (!focusGuardActive) {
        document.addEventListener("focusin", keepFocusInside, true);
        document.addEventListener("keydown", handleDialogKeydown, true);
        focusGuardActive = true;
      }
      window.setTimeout(() => {
        if (!dialog.classList.contains("active")) return;
        dialog.focus({ preventScroll: true });
      }, 0);
    }

    function closeDialog(accepted) {
      if (!dialog.classList.contains("active")) return;
      if (accepted) {
        acceptedThisPage = true;
        try {
          window.localStorage.setItem("morro_privacy_accepted", "true");
        } catch {
          // In-memory consent keeps the form usable when storage is blocked.
        }
      }

      dialog.classList.remove("active");
      dialog.setAttribute("aria-hidden", "true");
      document.body.classList.remove("dialog-open");
      document.removeEventListener("focusin", keepFocusInside, true);
      document.removeEventListener("keydown", handleDialogKeydown, true);
      focusGuardActive = false;

      if (accepted) {
        email.readOnly = false;
        window.setTimeout(() => email.focus(), 0);
      } else {
        email.blur();
        const returnTarget = previousFocus && previousFocus !== email && document.contains(previousFocus)
          ? previousFocus
          : captureSection;
        window.setTimeout(() => returnTarget && returnTarget.focus({ preventScroll: true }), 0);
      }
    }

    function interceptEmailEntry(event) {
      if (isAccepted()) {
        email.readOnly = false;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      email.readOnly = true;
      email.blur();
      if (event.type === "focus") window.setTimeout(openDialog, 30);
      else openDialog();
    }

    email.addEventListener("pointerdown", interceptEmailEntry, true);
    email.addEventListener("touchstart", interceptEmailEntry, { capture: true, passive: false });
    email.addEventListener("focus", interceptEmailEntry, true);
    email.addEventListener("click", interceptEmailEntry, true);

    acceptButton.addEventListener("click", () => closeDialog(true));
    declineButton.addEventListener("click", () => closeDialog(false));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(false);
    });

    return { isAccepted, openDialog };
  }

  // --- Waitlist form ---
  function initializeWaitlist(privacyGate) {
    const form = document.getElementById("betaForm");
    const email = document.getElementById("beta-email");
    const submitButton = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("formError");
    const successMessage = document.getElementById("formSuccess");
    const referralField = document.getElementById("refField");
    if (!form || !email || !submitButton || !errorMessage || !successMessage) return;

    const urlParams = new URLSearchParams(window.location.search);
    let ref = urlParams.get(‘ref’);
    if (ref) {
        const cleanRef = ref.replace(/[^a-zA-Z0-9_-]/g, ‘’).substring(0, 50);
        const refField = document.getElementById(‘ref_field’);
        if (refField) {
            refField.value = cleanRef;
        }
    }

    // Email validation feedback
    email.addEventListener(‘input’, () => {
      if (email.validity.valid) {
        email.style.borderColor = ‘’;
      }
    });

    email.addEventListener(‘blur’, () => {
      if (!email.validity.valid && email.value) {
        email.style.borderColor = ‘#d95f45’;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorMessage.hidden = true;
      if (!form.reportValidity()) return;
      if (privacyGate && !privacyGate.isAccepted()) {
        privacyGate.openDialog();
        return;
      }

      const originalButtonContent = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitButton.innerHTML = ‘Joining… <span class="spin" aria-hidden="true">⟳</span>’;

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "The waitlist service did not accept this entry.");
        form.hidden = true;
        successMessage.hidden = false;
        successMessage.focus();
      } catch {
        errorMessage.textContent = "That didn’t go through. Check your connection and try again.";
        errorMessage.hidden = false;
      } finally {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.innerHTML = originalButtonContent;
      }
    });
  }

  // --- Initialize everything ---
  document.addEventListener("DOMContentLoaded", () => {
    root.classList.add("page-ready");
    initializeReveals();
    initializeScrollProgress();
    initializeGateTabs();
    initializeParallax();
    initializeSmoothScroll();
    initializeButtonRipple();
    initializeKeyboardNav();
    const privacyGate = initializePrivacyDialog();
    initializeWaitlist(privacyGate);
  });
})();

(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js-ready");

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
    }, { threshold: 0.15, rootMargin: "0px 0px -30px 0px" });

    targets.forEach((target) => observer.observe(target));
  }

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

  function initializeGateTabs() {
    const tabs = Array.from(document.querySelectorAll(".gate-tab[role='tab']"));
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
  }

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
      return Array.from(dialog.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"))
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

  function initializeWaitlist(privacyGate) {
    const form = document.getElementById("betaForm");
    const email = document.getElementById("beta-email");
    const submitButton = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("formError");
    const successMessage = document.getElementById("formSuccess");
    const referralField = document.getElementById("refField");
    if (!form || !email || !submitButton || !errorMessage || !successMessage) return;

    const query = new URLSearchParams(window.location.search);
    if (referralField) referralField.value = query.get("ref") || "direct";

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
      submitButton.textContent = "Joining…";

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

  document.addEventListener("DOMContentLoaded", () => {
    root.classList.add("page-ready");
    initializeReveals();
    initializeScrollProgress();
    initializeGateTabs();
    const privacyGate = initializePrivacyDialog();
    initializeWaitlist(privacyGate);
  });
})();

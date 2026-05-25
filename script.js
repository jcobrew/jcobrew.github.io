(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // Scroll reveal for sections
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("section").forEach((s) => io.observe(s));
  } else {
    document.querySelectorAll("section").forEach((s) => s.classList.add("in-view"));
  }

  // Reel: click to expand (placeholder until real <video> is dropped in)
  const reel = document.querySelector(".reel-frame");
  if (reel) {
    reel.addEventListener("click", () => reel.classList.toggle("expanded"));
    reel.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        reel.classList.toggle("expanded");
      }
    });
  }

  // Cursor-driven side peek
  if (!isMobile && !reduceMotion) {
    const leftPeeks = Array.from(document.querySelectorAll(".peek.left"));
    const rightPeeks = Array.from(document.querySelectorAll(".peek.right"));

    let targetLeft = 0;
    let targetRight = 0;
    let progLeft = 0;
    let progRight = 0;
    let mouseY = window.innerHeight / 2;

    const baseRot = (el) => parseFloat(el.dataset.rot || "0");
    const baseOff = (el) => parseFloat(el.dataset.off || "96");

    function onMove(e) {
      const w = window.innerWidth;
      const x = e.clientX;
      mouseY = e.clientY;
      const frac = x / w;
      targetLeft = Math.max(0, 1 - frac * 2.5);
      targetRight = Math.max(0, 1 - (1 - frac) * 2.5);
    }

    function tick() {
      progLeft += (targetLeft - progLeft) * 0.09;
      progRight += (targetRight - progRight) * 0.09;
      const yTilt = (mouseY / window.innerHeight - 0.5) * 6;

      leftPeeks.forEach((p, i) => {
        const off = baseOff(p);
        const tx = -off + progLeft * (off - 4 - i * 2);
        p.style.transform = `translateX(${tx}%) rotate(${baseRot(p) + yTilt * 0.4}deg)`;
      });
      rightPeeks.forEach((p, i) => {
        const off = baseOff(p);
        const tx = off - progRight * (off - 4 - i * 2);
        p.style.transform = `translateX(${tx}%) rotate(${baseRot(p) + yTilt * 0.4}deg)`;
      });

      requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    requestAnimationFrame(tick);
  }

  // Moonset (story page only): map scroll progress to CSS variables that
  // drive sky color, moon arc, sun glow, and cloud opacity.
  if (document.body.classList.contains("story")) {
    const root = document.documentElement;
    const MOON_X_START = 15, MOON_X_END = 78;   // vw
    const MOON_Y_START = 12, MOON_Y_END = 88;   // vh
    const CLOUD_OP_START = 0.35, CLOUD_OP_END = 0.15;
    const SUN_RAMP_START = 0.7, SUN_MAX = 0.85;

    function readProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return 0;
      const p = window.scrollY / max;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }

    function applyProgress(p) {
      const eased = p * p; // easeInQuad — moon descends faster near horizon
      const sun = p < SUN_RAMP_START
        ? 0
        : ((p - SUN_RAMP_START) / (1 - SUN_RAMP_START)) * SUN_MAX;
      root.style.setProperty("--scroll-progress", p.toFixed(4));
      root.style.setProperty("--moon-x", (MOON_X_START + (MOON_X_END - MOON_X_START) * p).toFixed(2) + "vw");
      root.style.setProperty("--moon-y", (MOON_Y_START + (MOON_Y_END - MOON_Y_START) * eased).toFixed(2) + "vh");
      root.style.setProperty("--moon-glow-intensity", eased.toFixed(4));
      root.style.setProperty("--sun-opacity", sun.toFixed(4));
      root.style.setProperty("--cloud-opacity",
        (CLOUD_OP_START + (CLOUD_OP_END - CLOUD_OP_START) * p).toFixed(4));
    }

    let target = readProgress();
    let current = target;
    applyProgress(current);

    if (reduceMotion) {
      // No smoothing loop — write straight from scroll events.
      window.addEventListener("scroll", () => applyProgress(readProgress()), { passive: true });
    } else {
      window.addEventListener("scroll", () => { target = readProgress(); }, { passive: true });
      const moonTick = () => {
        current += (target - current) * 0.14;
        if (Math.abs(target - current) < 0.0004) current = target;
        applyProgress(current);
        requestAnimationFrame(moonTick);
      };
      requestAnimationFrame(moonTick);
    }
  }
})();

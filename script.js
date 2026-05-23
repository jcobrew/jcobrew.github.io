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
})();

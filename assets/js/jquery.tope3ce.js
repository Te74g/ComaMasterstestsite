(function (global, document) {
  "use strict";

  const visual = document.querySelector(".top-kv__visual");
  if (!visual) {
    return;
  }

  const silhouette = visual.querySelector(".figure-silhouette");
  const gems = Array.from(visual.querySelectorAll(".ring-gem"));

  function onMove(event) {
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (silhouette) {
      silhouette.style.transform = `rotate(${-12 + x * 5}deg) translate(${x * 10}px, ${y * 8}px)`;
    }

    gems.forEach((gem, index) => {
      const factor = (index + 1) * 0.35;
      gem.style.transform = `translate(${x * 10 * factor}px, ${y * 8 * factor}px)`;
    });
  }

  function resetMove() {
    if (silhouette) {
      silhouette.style.transform = "rotate(-12deg)";
    }
    gems.forEach((gem) => {
      gem.style.transform = "";
    });
  }

  visual.addEventListener("pointermove", onMove);
  visual.addEventListener("pointerleave", resetMove);

  global.addEventListener("load", function () {
    document.body.classList.add("is-ready");
  });
})(window, document);

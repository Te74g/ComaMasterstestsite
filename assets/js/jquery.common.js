(function (global, document) {
  "use strict";

  const conf = global.COMA || {};
  const page = document.body.getAttribute("data-page") || "";
  const navLinks = Array.from(document.querySelectorAll(conf.navSelector || ".site-nav__link[data-nav]"));
  const menuButton = document.getElementById("siteMenuButton");
  const nav = document.getElementById("siteNav");
  const yearNode = document.getElementById("jsCurrentYear");

  for (const link of navLinks) {
    if (link.getAttribute("data-nav") === page) {
      link.classList.add("is-current");
    }
  }

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) {
        return;
      }
      if (nav.contains(event.target) || menuButton.contains(event.target)) {
        return;
      }
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });

    global.addEventListener("resize", function () {
      if (global.innerWidth > (conf.mobileWidth || 860) && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }
})(window, document);

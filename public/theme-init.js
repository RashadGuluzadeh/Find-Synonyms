(function () {
  try {
    var saved = localStorage.getItem("fs:theme");
    var dark = saved === "dark" || (saved !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {
    /* storage unavailable: fall back to light theme */
  }
})();

const track = document.getElementById("hero-ads-track");

if (track) {
  const slides = [...track.querySelectorAll(".hero__bg-slide")];
  let index = 0;

  function restartKenBurns(slide) {
    const img = slide.querySelector("img");
    if (!img) return;
    img.style.animation = "none";
    void img.offsetHeight;
    img.style.animation = "";
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) => {
      const active = n === index;
      slide.classList.toggle("is-active", active);
      if (active) restartKenBurns(slide);
    });
  }

  track.querySelectorAll(".hero__bg-slide img").forEach((img) => {
    img.addEventListener("error", () => {
      img.style.display = "none";
    });
  });

  if (slides.length > 1) {
    goTo(0);
    setInterval(() => goTo(index + 1), 7000);
  } else if (slides.length === 1) {
    slides[0].classList.add("is-active");
  }
}

let bannerSlider = createBannerSlider();

function createBannerSlider(startIndex = 0) {
  const slider = new Swiper(".banner-collection", {
    init: false,
    initialSlide: startIndex,
    slidesPerView: 1,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
  });
  slider.init();
  return slider;
}

document.addEventListener("shopify:block:select", (event) => {
  const index = parseInt(event.target.dataset.index);
  bannerSlider.slideTo(index);
});

document.addEventListener("shopify:section:load", () => {
  const currentIndex = bannerSlider.activeIndex;
  bannerSlider.destroy(true, true);
  bannerSlider = createBannerSlider(currentIndex);
});

document.addEventListener("shopify:section:unload", () => {
  bannerSlider.destroy(true, true);
});

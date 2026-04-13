let productCollectionSlider = createProductCollectionSlider();

function createProductCollectionSlider(startIndex = 0) {
  const slider = new Swiper(".product-collection-slider", {
    init: false,
    initialSlide: startIndex,
    slidesPerView: 1.5,
    spaceBetween: 16,
    speed: 900,
    navigation: {
      nextEl: `[data-product-collection="next"]`,
      prevEl: `[data-product-collection="prev"]`,
    },

    scrollbar: {
      el: "[data-product-collection-scrollbar]",
    },
    breakpoints: {
      1200: {
        slidesPerView: 4.5,
      },
      768: {
        slidesPerView: 2.5,
      },
    },
  });

  slider.init();
  return slider;
}

document.addEventListener("shopify:block:select", (event) => {
  const index = parseInt(event.target.dataset.index);
  productCollectionSlider.slideTo(index);
});

document.addEventListener("shopify:section:load", () => {
  const currentIndex = productCollectionSlider.activeIndex;
  productCollectionSlider.destroy(true, true);
  productCollectionSlider = createProductCollectionSlider(currentIndex);
});

document.addEventListener("shopify:section:unload", () => {
  productCollectionSlider.destroy(true, true);
});

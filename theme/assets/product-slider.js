class CollectionSelect extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.trigger = this.querySelector(".collection-select__trigger");
    this.selectedLabel = this.querySelector(".collection-select__selected");
    this.optionsList = this.querySelector(".collection-select__options");
    this.options = this.querySelectorAll(".collection-select__option");

    this.trigger.addEventListener("click", () => this.toggle());

    this.options.forEach((option) => {
      option.addEventListener("click", () => this.select(option));
    });

    document.addEventListener("click", (e) => {
      if (!this.contains(e.target)) this.close();
    });
  }

  toggle() {
    this.classList.toggle("is-open");
  }

  close() {
    this.classList.remove("is-open");
  }

  select(option) {
    this.selectedLabel.textContent = option.textContent.trim();
    this.options.forEach((o) => o.classList.remove("is-selected"));
    option.classList.add("is-selected");
    this.close();

    this.dispatchEvent(
      new CustomEvent("collection:change", {
        bubbles: true,
        detail: {
          collectionId: option.dataset.value,
          sectionId: this.sectionId,
        },
      }),
    );
  }
}

customElements.define("collection-select", CollectionSelect);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSectionId() {
  return document.querySelector("collection-select")?.dataset.sectionId;
}

// ─── Slider ─────────────────────────────────────────────────────────────────

let productSlider = null;

function createProductSlider(startIndex = 0) {
  const slider = new Swiper(".product-slider", {
    init: false,
    initialSlide: startIndex,
    slidesPerView: 1.5,
    spaceBetween: 16,
    speed: 900,
    navigation: {
      nextEl: `[data-product="next"]`,
      prevEl: `[data-product="prev"]`,
    },
    scrollbar: {
      el: "[data-product-scrollbar]",
    },
    breakpoints: {
      1200: { slidesPerView: 4.5 },
      768: { slidesPerView: 2.5 },
    },
  });

  slider.init();
  return slider;
}

function destroySlider() {
  if (productSlider && !productSlider.destroyed) {
    productSlider.destroy(true, true);
  }
  productSlider = null;
}

// ─── Collection filtering ────────────────────────────────────────────────────

function filterByCollection(collectionId, sectionId) {
  const wrapper = document.getElementById(`swiper-wrapper-${sectionId}`);
  const template = document.querySelector(
    `template[data-collection-id="${collectionId}"][data-section-id="${sectionId}"]`,
  );

  if (!wrapper || !template) return;

  destroySlider();
  wrapper.innerHTML = "";
  wrapper.appendChild(template.content.cloneNode(true));
  productSlider = createProductSlider(0);
}

let filterAbortController = new AbortController();

function initCollectionFilter(sectionId) {
  filterAbortController.abort();
  filterAbortController = new AbortController();

  document.addEventListener(
    "collection:change",
    (e) => {
      if (e.detail.sectionId !== sectionId) return;
      filterByCollection(e.detail.collectionId, e.detail.sectionId);
    },
    { signal: filterAbortController.signal },
  );
}

// ─── Init ────────────────────────────────────────────────────────────────────

productSlider = createProductSlider();
initCollectionFilter(getSectionId());

// ─── Shopify editor events ───────────────────────────────────────────────────

document.addEventListener("shopify:block:select", (event) => {
  const index = parseInt(event.target.dataset.index);
  productSlider?.slideTo(index);
});

document.addEventListener("shopify:section:load", () => {
  destroySlider();
  productSlider = createProductSlider(0);
  initCollectionFilter(getSectionId());
});

document.addEventListener("shopify:section:unload", () => {
  destroySlider();
  filterAbortController.abort();
});

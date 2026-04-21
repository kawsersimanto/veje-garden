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

function createProductSlider(sectionEl, startIndex = 0) {
  const sliderEl = sectionEl.querySelector(".product-slider");
  if (!sliderEl) return null;

  const spaceBetween = parseInt(sliderEl.dataset.spaceBetween ?? 16);
  const spaceBetweenDesktop = parseInt(
    sliderEl.dataset.spaceBetweenDesktop ?? 16,
  );

  const slider = new Swiper(sliderEl, {
    // pass the element, not a string
    init: false,
    initialSlide: startIndex,
    slidesPerView: 1.5,
    spaceBetween,
    speed: 900,
    navigation: {
      nextEl: sectionEl.querySelector('[data-product="next"]'),
      prevEl: sectionEl.querySelector('[data-product="prev"]'),
    },
    scrollbar: {
      el: sectionEl.querySelector("[data-product-scrollbar]"),
    },
    breakpoints: {
      1200: { slidesPerView: 4, spaceBetween: spaceBetweenDesktop },
      768: { slidesPerView: 2.5, spaceBetween: spaceBetweenDesktop },
    },
  });

  slider.init();
  return slider;
}

function destroySlider(slider) {
  if (slider && !slider.destroyed) slider.destroy(true, true);
  return null;
}

function filterByCollection(collectionId, sectionId, sectionEl, slider) {
  const wrapper = sectionEl.querySelector(`#swiper-wrapper-${sectionId}`);
  const template = sectionEl.querySelector(
    `template[data-collection-id="${collectionId}"]`,
  );

  if (!wrapper || !template) return slider;

  slider = destroySlider(slider);
  wrapper.innerHTML = "";
  wrapper.appendChild(template.content.cloneNode(true));
  return createProductSlider(sectionEl, 0);
}

function initSection(sectionEl) {
  let slider = createProductSlider(sectionEl);
  const sectionId =
    sectionEl.querySelector("collection-select")?.dataset.sectionId;
  const abortController = new AbortController();

  sectionEl.addEventListener(
    "collection:change",
    (e) => {
      slider = filterByCollection(
        e.detail.collectionId,
        e.detail.sectionId,
        sectionEl,
        slider,
      );
    },
    { signal: abortController.signal },
  );

  return { slider, abortController };
}

// ─── Init all sections on page load ─────────────────────────────────────────

const sectionInstances = new Map();

document.querySelectorAll(".product-slider-section").forEach((sectionEl) => {
  sectionInstances.set(sectionEl, initSection(sectionEl));
});

// ─── Shopify editor events ───────────────────────────────────────────────────

document.addEventListener("shopify:block:select", (event) => {
  const sectionEl = event.target.closest(".product-slider-section");
  const instance = sectionInstances.get(sectionEl);
  const index = parseInt(event.target.dataset.index);
  instance?.slider?.slideTo(index);
});

document.addEventListener("shopify:section:load", (event) => {
  const sectionEl = event.target.querySelector(".product-slider-section");
  if (!sectionEl) return;
  const instance = sectionInstances.get(sectionEl);
  instance?.abortController.abort();
  instance?.slider && destroySlider(instance.slider);
  sectionInstances.set(sectionEl, initSection(sectionEl));
});

document.addEventListener("shopify:section:unload", (event) => {
  const sectionEl = event.target.querySelector(".product-slider-section");
  if (!sectionEl) return;
  const instance = sectionInstances.get(sectionEl);
  instance?.abortController.abort();
  destroySlider(instance?.slider);
  sectionInstances.delete(sectionEl);
});

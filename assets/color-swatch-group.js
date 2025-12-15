(function () {
  'use strict';

    /*
    preprocessHTML(productElement) {
        productElement.classList.forEach((classApplied) => {
            if (classApplied.startsWith('color-') || classApplied === 'gradient')
            this.modalContent.classList.add(classApplied);
        });
        this.preventDuplicatedIDs(productElement);
        this.removeDOMElements(productElement);
        this.removeGalleryListSemantic(productElement);
        this.updateImageSizes(productElement);
        this.preventVariantURLSwitching(productElement);
    }

    preventVariantURLSwitching(productElement) {
        productElement.setAttribute('data-update-url', 'false');
    }

    removeDOMElements(productElement) {
        const pickupAvailability = productElement.querySelector('pickup-availability');
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = productElement.querySelector('product-modal');
        if (productModal) productModal.remove();

        const modalDialog = productElement.querySelectorAll('modal-dialog');
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
        }

        preventDuplicatedIDs(productElement) {
        const sectionId = productElement.dataset.section;

        const oldId = sectionId;
        const newId = `quickadd-${sectionId}`;
        productElement.innerHTML = productElement.innerHTML.replaceAll(oldId, newId);
        Array.from(productElement.attributes).forEach((attribute) => {
            if (attribute.value.includes(oldId)) {
            productElement.setAttribute(attribute.name, attribute.value.replace(oldId, newId));
            }
        });

        productElement.dataset.originalSection = sectionId;
    }

    removeGalleryListSemantic(productElement) {
        const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
        if (!galleryList) return;

        galleryList.setAttribute('role', 'presentation');
        galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
    }

    updateImageSizes(productElement) {
        const product = productElement.querySelector('.product');
        const desktopColumns = product?.classList.contains('product--columns');
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll('.product__media img');
        if (!mediaImages.length) return;

        let mediaImageSizes =
            '(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)';

        if (product.classList.contains('product--medium')) {
            mediaImageSizes = mediaImageSizes.replace('715px', '605px');
        } else if (product.classList.contains('product--small')) {
            mediaImageSizes = mediaImageSizes.replace('715px', '495px');
        }

        mediaImages.forEach((img) => img.setAttribute('sizes', mediaImageSizes));
    }
    */

  // SAFEST fetch helper: supports raw text + parsed JSON
  async function fetchJsonOrText(url) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json,text/plain,text/html,*/*'
      }
    });

    const rawText = await response.text();

    let parsed = null;
    let isJson = false;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
        isJson = true;
      } catch (e) {
        isJson = false;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      isJson,
      rawText,
      data: parsed
    };
  }

  // Event delegation (replacement for jQuery(document).on)
  document.addEventListener('click', async function (event) {
    const trigger = event.target.closest('[data-ele="color-group-product"]');

    if (!trigger) return;


    const quickAddModal = trigger.closest('quick-add-modal')
    console.log('quickAddModal', quickAddModal);
    if (quickAddModal && quickAddModal.hasAttribute('open')) {
        event.preventDefault();
        const modalContent = quickAddModal.querySelector('[id^="QuickAddInfo-"]');
        const actionUrl = trigger.getAttribute('href');
        const result = await fetchJsonOrText(actionUrl);
        if (!result.ok) {
            console.error('Request failed:', result.status, result.rawText);
            return;
        }
        
        console.log('result', result);
        const responseHTML = new DOMParser().parseFromString(result.rawText, 'text/html');
        const productElement = responseHTML.querySelector('product-info');
        console.log('productElement', productElement);
        console.log('productElement.outerHTML', productElement.outerHTML);
        HTMLUpdateUtility.setInnerHTML(modalContent, productElement.outerHTML);
        return;
    }

     // 2. PRODUCT PAGE → NORMAL NAVIGATION
    const productInfo = trigger.closest('product-info')
    if (productInfo) {
      return;
    }




    

    event.preventDefault();

    const params = new URLSearchParams({
        media_aspect_ratio: trigger.dataset.media_aspect_ratio,
        image_shape: trigger.dataset.image_shape,
        show_secondary_image: trigger.dataset.show_secondary_image,
        show_vendor: trigger.dataset.show_vendor,
        show_rating: trigger.dataset.show_rating,
        quick_add: trigger.dataset.quick_add
    });

    const cardContainer = trigger.closest('li.grid__item');
    const actionUrl = trigger.getAttribute('data-action-card-json');

    if (!actionUrl) {
      console.warn('Missing data-action-card-json attribute');
      return;
    }

    const url = `${actionUrl}&${params.toString()}`;

    try {
      const result = await fetchJsonOrText(url);

      if (!result.ok) {
        console.error('Request failed:', result.status, result.rawText);
        return;
      }

      if (result.isJson) {
        console.log('Parsed JSON:', result.data);

        if (result.data && result.data.card_html && cardContainer) {
          cardContainer.innerHTML = result.data.card_html;
        }
      } else {
        console.warn('Response is not valid JSON. Raw text follows:');
        console.log(result.rawText);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  });
})();
# Color Group Swatches (Product-Based)
## Shopify Implementation Guide
---

## Overview

This feature implements **color swatches using separate products**, not Shopify variants.

Each color is its own product, but from a user perspective it behaves like a variant selector.

### Supported Areas

- Collection product cards (listing pages)
- Product detail page
- Quick Add modal
- Dynamic product card replacement (no page reload)
- Metaobject-based grouping with product-level override

### Why This Approach

- Avoids Shopify variant limits
- Allows unique images, pricing, inventory per color
- Better SEO (each color has its own URL)
- Cleaner merchandising and analytics

---

## Data Model

### Product Metafields (Priority Order)

1. **`custom.related_color_product`**
   - Type: List of products
   - Optional
   - If set, this overrides all other sources

2. **`custom.color_group`**
   - Type: Metaobject reference
   - Used only if `related_color_product` is empty

---

### Metaobject: `color_group`

Fields:

- **products**
  - Type: List of products
  - Used to group all color products

- **title**
  - Admin reference only
  - Not used in code

---

## Files to Be Added

### 1. `snippets/color-swatches-group.liquid`

**Purpose**
- Resolve color group products
- Render swatch container
- Ensure current product is included
- Load JS and CSS once per page


**Path**

```
snippets/color-swatches-group.liquid
```

```liquid
{% comment %}
  Renders a products list from the color group/metafield

  Accepts:
  - product: {Object} product (required)
  - media_aspect_ratio: {String} Size of the product image card. Values are "square" and "portrait". Default is "square" (optional)
  - image_shape: {String} Image mask to apply to the product image card. Values are "arch", "blob", "chevronleft", "chevronright", "diamond", "parallelogram", and "round". (optional)
  - show_secondary_image: {Boolean} Show the secondary image on hover. Default: false (optional)
  - show_vendor: {Boolean} Show the product vendor. Default: false
  - show_rating: {Boolean} Show the product rating. Default: false
  - quick_add: {Boolean} Show the quick add button.

  Usage:
  {% render 'color-swatches-group', product:product, show_vendor: section.settings.show_vendor %}
{% endcomment %}
{% assign current_product_in_group = false %}
{% assign related_color_products = product.metafields.product.related_color_product | default:product.metafields.custom.related_color_product %}

{% assign related_colors_metaobject = product.metafields.custom.color_group.value | default:product.metafields.product.color_group.value %}
{% assign metaobject_color_products = related_colors_metaobject.product.value | default:related_colors_metaobject.products.value %}
{% assign color_products = related_color_products.value | default:metaobject_color_products %}

{% comment %} {{ color_products | json }} {% endcomment %}
{% if color_products and color_products.size > 0 %}
    <variant-selects id="variant-product-selects-template--{{ section.id }}__main" data-section="template--product-{{ section.id }}__main" data-ele="variant-product-selects" data-ele-type="{{ location }}">
      <fieldset class="js product-form__input product-form__input--pill">
          <legend class="form__label">{{ block.setting.option_heading | default: 'Colors' }}</legend>
          <div class="variant-product-options-container" data-ele="variant-product-options-container">
            {% for referenced_product in color_products %}
                {% if product.id == referenced_product.id %}
                    {% assign current_product_in_group = true %}
                {% endif %}
                {% render 'color-swatches-group-snippet', 
                  product: product,
                  referenced_product: referenced_product,
                  media_aspect_ratio: media_aspect_ratio,
                  image_shape: image_shape,
                  show_secondary_image: show_secondary_image,
                  show_vendor: show_vendor,
                  show_rating: show_rating,
                  quick_add: quick_add 
                %}
            {% endfor %}
            {% if current_product_in_group == false %}
              {% render 'color-swatches-group-snippet', 
                product: product,
                referenced_product: product,
                media_aspect_ratio: media_aspect_ratio,
                image_shape: image_shape,
                show_secondary_image: show_secondary_image,
                show_vendor: show_vendor,
                show_rating: show_rating,
                quick_add: quick_add 
              %}
            {% endif %}
          </div>
      </fieldset>
    </variant-selects>
{% endif %}

<script>
  (function () {
    // Load JS module
    if (!document.getElementById('color-swatch-group--js')) {
      var js = document.createElement('script');
      js.id = 'color-swatch-group--js';
      js.type = 'module';
      js.src = "{{ 'color-swatch-group.js' | asset_url }}";
      document.head.appendChild(js);
    }

    // Load CSS
    if (!document.getElementById('color-swatch-group--css')) {
      var css = document.createElement('link');
      css.id = 'color-swatch-group--css';
      css.rel = 'stylesheet';
      css.href = "{{ 'color-swatch-group-swatch.css' | asset_url }}";
      document.head.appendChild(css);
    }
  })();
</script>
````

---

### 2. `snippets/color-swatches-group-snippet.liquid`

**Purpose**

* Render a single swatch
* Apply active state
* Attach JS data attributes

**Path**

```
snippets/color-swatches-group-snippet.liquid
```

```liquid
{% comment %}
  Renders products card for the color group/metafield

  Accepts:
  - referenced_product: {Object} product (required)
  - media_aspect_ratio: {String} Size of the product image card. Values are "square" and "portrait". Default is "square" (optional)
  - image_shape: {String} Image mask to apply to the product image card. Values are "arch", "blob", "chevronleft", "chevronright", "diamond", "parallelogram", and "round". (optional)
  - show_secondary_image: {Boolean} Show the secondary image on hover. Default: false (optional)
  - show_vendor: {Boolean} Show the product vendor. Default: false
  - show_rating: {Boolean} Show the product rating. Default: false
  - quick_add: {Boolean} Show the quick add button.

  Usage:
  {% render 'color-swatches-group-snippet', product:product, show_vendor: section.settings.show_vendor %}
{% endcomment %}
<span ele-id="option--product--{{ referenced_product.id }}" class="variant-option {% if product.id == referenced_product.id %} {{ 'active-option' }} {% endif %}">
    <span class="visually-hidden label-unavailable">Variant sold out or unavailable</span>
    <a 
        data-p-id="{{ product.id }}"
        id="QuickAddInfo-{{ product.id }}"
        data-ele="color-group-product" 
        href="{{ referenced_product.url }}" 
        data-action="{{ referenced_product.url | append: '.json' }}"
        data-action-card-json="{{ referenced_product.url | append: '?view=product-card-json' }}"
        data-media_aspect_ratio="{{ media_aspect_ratio }}"
        data-image_shape="{{ image_shape }}"
        data-show_secondary_image="{{ show_secondary_image }}"
        data-show_vendor="{{ show_vendor }}"
        data-show_rating="{{ show_rating }}"
        data-quick_add="{{ quick_add }}"
    >
        {% if referenced_product.featured_image %}
            {%- liquid
                assign image_url = referenced_product.featured_image | image_url: width: 50
                assign swatch_value = 'url(' | append: image_url | append: ')'
                assign swatch_focal_point = swatch.image.presentation.focal_point
            -%}
            <span
            {% if swatch_value %}
                class="swatch{% if shape == 'square' %} swatch--square{% endif %}"
                style="--swatch--background: {{ swatch_value }};{% if swatch_focal_point %} --swatch-focal-point: {{ swatch_focal_point }};{% endif %}"
            {% endif %}
            ></span>
        {% else %}
            <span class="swatch swatch--square">{{ referenced_product.title }}</span>
        {% endif %}
    </a>
</span>
```

---

### 3. `templates/product.product-card-json.liquid`

**Purpose**

* Render a single product card using AJAX
* Apply active state

**Path**

```
templates/product.product-card-json.liquid
```

```liquid
{% layout none %}

{%- liquid
  assign random_hash = 'now' | date: '%s%N'
  assign section_uid = product.id | append: '--' | append: random_hash
  assign skip_card_product_styles = false
  assign lazy_load = false
  assign media_aspect_ratio = ''
  assign image_shape = ''
  assign show_secondary_image = ''
  assign show_vendor = ''
  assign show_rating = ''
  assign quick_add = ''
  

  # theme-check-disable
  capture content_for_query_string
    echo content_for_header
  endcapture
  # theme-check-enable

  assign page_url = content_for_query_string | split: '"pageurl":"' | last | split: '"' | first | split: '.myshopify.com' | last | replace: '\/', '/' | replace: '%20', ' ' | replace: '\u0026', '&'

  assign page_query_string = page_url | split: '/' | last
  assign split_string = page_query_string | split: '?' 
  assign parameters_raw = split_string[1] | downcase | split: '&'
  assign parameters = parameters_raw | url_decode

  for parameter in parameters_raw
    assign parameter_arr = parameter | split: '='
    assign parameter_property = parameter_arr[0] | downcase
    if parameter_property == 'media_aspect_ratio'
      assign media_aspect_ratio = parameter_arr[1]
    endif
    if parameter_property == 'image_shape'
      assign image_shape = parameter_arr[1]
    endif
    if parameter_property == 'show_secondary_image'
      assign show_secondary_image = parameter_arr[1]
    endif
    if parameter_property == 'show_vendor'
      assign show_vendor = parameter_arr[1]
    endif
    if parameter_property == 'show_rating'
      assign show_rating = parameter_arr[1]
    endif
    if parameter_property == 'quick_add'
      assign quick_add = parameter_arr[1]
    endif
  endfor
-%}

{% capture card_html %}
  {% render 'card-product',
    card_product: product,
    lazy_load: lazy_load,
    skip_styles: skip_card_product_styles,
    media_aspect_ratio: media_aspect_ratio,
    image_shape: image_shape,
    show_secondary_image: show_secondary_image,
    show_vendor: show_vendor,
    show_rating: show_rating,
    quick_add: quick_add,
    section_id: section_uid
  %}
{% endcapture %}

{
  "id": {{ product.id | json }},
  "params": {{ parameters | json }},
  "title": {{ product.title | json }},
  "handle": {{ product.handle | json }},
  "description": {{ product.description | json }},
  "vendor": {{ product.vendor | json }},
  "images": {{ product.images | json }},
  "variants": {{ product.variants | json }},
  "card_html": {{ card_html | json }}
}
```

---

### 4. `assets/color-swatch-group-script.js`

**Purpose**

* Handle swatch clicks
* Detect context (collection, quick add, product page)
* Replace content dynamically

**Path**

```
assets/color-swatch-group.js
```

```javascript
(function () {
  'use strict';

  async function fetchJsonOrText(url) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json,text/html,*/*' }
    });

    const rawText = await response.text();
    let data = null;

    try {
      data = JSON.parse(rawText);
    } catch (e) {}

    return { ok: response.ok, rawText, data };
  }

  document.addEventListener('click', async function (event) {
    const trigger = event.target.closest('[data-ele="color-group-product"]');
    if (!trigger) return;

    const quickAddModal = trigger.closest('quick-add-modal');

    if (quickAddModal && quickAddModal.hasAttribute('open')) {
      event.preventDefault();

      const modalContent = quickAddModal.querySelector('[id^="QuickAddInfo-"]');
      const result = await fetchJsonOrText(trigger.href);

      const html = new DOMParser().parseFromString(result.rawText, 'text/html');
      const productInfo = html.querySelector('product-info');

      HTMLUpdateUtility.setInnerHTML(modalContent, productInfo.outerHTML);
      return;
    }

    if (trigger.closest('product-info')) return;

    event.preventDefault();

    const card = trigger.closest('li.grid__item');
    const url = trigger.dataset.actionCardJson;
    if (!url || !card) return;

    const result = await fetchJsonOrText(url);

    if (result.data?.card_html) {
      card.innerHTML = result.data.card_html;
    }
  });
})();
```

---

### 5. `assets/color-swatch-group-swatch.css`

**Purpose**

* Swatch layout and styling
* Active state indicator

**Path**

```
assets/color-swatch-group-swatch.css
```

```css
[data-ele="variant-product-options-container"] {
  display: flex;
  gap: 1rem;
}

.swatch {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-size: cover;
  border: 2px solid rgba(0, 0, 0, 0.15);
}

.variant-option.active-option .swatch {
  border-color: red;
}
```

---

## Required Template (Mandatory)

### `templates/product.product-card-json.liquid`

**Purpose**

* Returns product card HTML as JSON
* Required for collection page swatch switching

**Path**

```
templates/product.product-card-json.liquid
```

Use the existing JSON template created for card replacement.

---

## Modify Existing Theme Files

---

### Product Detail Page

**File**

```
sections/main-product.liquid
```

Inside `{%- when 'variant_picker' -%}` add:

```liquid
{% render 'color-swatches-group',
  product: product,
  location: 'product_detail'
%}
```

---

### Product Cards (Collection Page)

**File**

```
snippets/card-product.liquid
```

Add:

```liquid
{% render 'color-swatches-group',
  product: card_product,
  location: 'product_card',
  media_aspect_ratio: media_aspect_ratio,
  image_shape: image_shape,
  show_secondary_image: show_secondary_image,
  show_vendor: show_vendor,
  show_rating: show_rating,
  quick_add: quick_add
%}
```

Quick Add:
```
<div data-ele="quick-add-icon"
  class="strch-quick-add" 
  {% if card_product.has_only_default_variant %} 
    data-product="only-default-variant" 
    data-product-default-variant-id="{{ card_product.selected_or_first_available_variant.id }}" 
  {% endif %}
  >
  <div class="quick-add-button-container">
    <span>
      <span class="strch-quick-add-icon">
        {{- 'icon-quick-add.svg' | inline_asset_content -}}
      </span>
    </span>
  </div>
</div>
```

---

## Admin Setup

For each color product, choose **one** approach:

### Option A: Product-Level Override

* Set `Related Color Products`
* Select all color products (including itself)

### Option B: Metaobject Group (Recommended)

* Create a `Color Group` metaobject
* Add all color products to it
* Assign the metaobject to each product using `Color Group` metafield

---

## Important Notes

* Do not use Shopify color variants with this system
* Every color product must have a featured image
* Do not rename data attributes
* Do not remove `product-card-json` template

---

## Result

After implementation:

* Colors behave like variants
* Products remain independent in Shopify
* Collection pages update instantly
* Quick Add modal works correctly
* Product pages remain SEO friendly


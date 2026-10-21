# carousel

Custom **carousel** block. Purpose: image slider with dot indicators and prev/next controls; image-only on adventure detail pages, image + overlapping text card on homepages (hero).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row per slide: image cell, optional content cell (heading, text, CTAs).

## Supported variations

| Variation | Option class |
| --- | --- |
| Hero | `hero` |

### Default vs. Hero

- **Default** (`Carousel`): each row holds one image-only cell. Used on adventure detail pages. Image renders full-width; dots are centred below, prev/next arrows sit bottom-right. A single row renders a static image with no controls.
- **Hero** (`Carousel (hero)`): each row holds an image cell plus a text cell (heading, paragraph, CTA link on its own line). The image renders taller and the text cell becomes a card that overlaps the bottom of the image (stacked below the image with a slight overlap on narrow screens). Cell order within a row does not matter; the image is always placed first.

## Universal Editor fields

N/A (Document Authoring project)

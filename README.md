<h1>Unicity Network Website</h1>   

A landing page built with Tailwindcss and the [Tailus Ada template](https://ui.tailus.io/templates/ada/).

## Build Setup

```bash
# install dependencies
$ npm install
# serve with hot reload at localhost:3000
$ npm run dev
# build for production and launch server
$ npm run build
# preview production
$ npm run preview
```

## Hero Section

### hero.js

[hero.js](public/hero.js) controls the animated scroll behind the hero section.
The hero section can be configured to the height needed and the animation breakpoints then controlled accordingly.
E.g, with a vh of 400: ending a transition after scrolling 1 screen height, there should be a breakpoint at 1/4 etc.
```javascript
const progress = Math.min(1, window.scrollY / (4 * window.innerHeight));
```

Breakpoints are added for
* the shape morph
* the line glow animation

```javascript
    // **Scroll position breakpoints for animations**
    const animationBreakpoints = [3/4]; 

    // ** Breakpoints for morphing **
    const breakpoints = [0, 1/96, 23/96, 25/96, 48/96, 1]; 
```

The number of breakpoints has to match the items in svgSequence
```javascript
const svgSequence = ["1.svg", "1.svg", "2.svg", "2.svg", "3.svg", "4.svg"];
```

### Preparing the SVGs

Use the Python snippets in [svg_prep.ipynb](svg_prep.ipynb) for preparing the SVGs.
* Each SVG in the morph has to include the same number of line elements.
* Only line elements are used in the morph, no paths, polygons, polylines etc.

## Customization - Tailus
* [Palette](https://beta.tailus.io/docs/customization/palette/) to learn how to customize the color palette.
* [Plugin](https://beta.tailus.io/docs/customization/plugin/) to learn how to customize the theme.


// loads an external SVG file and parses it into a Document
async function loadSVG(url) {
    const response = await fetch(url);
    const svgText = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(svgText, "image/svg+xml");
  }
  
  // Helper function: extracts line data (x1, y1, x2, y2) from an SVG document.
  function getLineDataFromDocument(doc) {
    return Array.from(doc.querySelectorAll("line")).map(line => ({
      x1: parseFloat(line.getAttribute("x1")),
      y1: parseFloat(line.getAttribute("y1")),
      x2: parseFloat(line.getAttribute("x2")),
      y2: parseFloat(line.getAttribute("y2"))
    }));
  }
  
  // Load the three external SVGs in parallel.
  Promise.all([
    loadSVG("1.svg"),
    loadSVG("2.svg"),
    loadSVG("3.svg")
  ]).then(([svg1Doc, svg2Doc, svg3Doc]) => {
    // Extract the line data arrays from each SVG.
    const shape1Data = getLineDataFromDocument(svg1Doc);
    const shape2Data = getLineDataFromDocument(svg2Doc);
    const shape3Data = getLineDataFromDocument(svg3Doc);
  
    // Create the visible line elements in our visible SVG.
    const visibleSVG = document.getElementById("hero-svg");
    const visibleLines = [];
    // (Assuming all shapes have the same number of lines.)
    shape1Data.forEach(() => {
      const lineElem = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lineElem.setAttribute("stroke", "#999");
      lineElem.setAttribute("stroke-width", 2);
      visibleSVG.appendChild(lineElem);
      visibleLines.push(lineElem);
    });
  
    // Linear interpolation helper.
    function lerp(start, end, t) {
      return start + (end - start) * t;
    }
  
    // Update the positions of the visible lines based on a normalized progress value.
  
    function updateLines(progress) {
      let startShape, endShape, localProgress;
    
      if (progress < 1 / 3) {
        // First third: morph from shape1 to shape2.
        localProgress = progress * 3;  // Normalize (0 → 1)
        startShape = shape1Data;
        endShape = shape2Data;
      } else if (progress < 2 / 3) {
        // Middle third: shape2 is fully visible (no morphing).
        localProgress = (progress - 1 / 3) * 3;
        startShape = shape2Data;
        endShape = shape3Data;
      } else {
        // Last third: morph from shape2 to shape3.
        localProgress = 1
        startShape = shape3Data;
        endShape = shape3Data;
      }
    
      // Interpolate between the corresponding endpoints.
      for (let i = 0; i < visibleLines.length; i++) {
        const start = startShape[i];
        const end = endShape[i];
        const x1 = lerp(start.x1, end.x1, localProgress);
        const y1 = lerp(start.y1, end.y1, localProgress);
        const x2 = lerp(start.x2, end.x2, localProgress);
        const y2 = lerp(start.y2, end.y2, localProgress);
    
        visibleLines[i].setAttribute("x1", x1);
        visibleLines[i].setAttribute("y1", y1);
        visibleLines[i].setAttribute("x2", x2);
        visibleLines[i].setAttribute("y2", y2);
      }
    }
    
  
    // Animation loop: tie the morphing to the scroll position.
    function update() {
      // Calculate a progress value between 0 and 1 based on the scroll position.
      const progress = Math.min(1, window.scrollY / (3 * window.innerHeight));
      updateLines(progress);
      requestAnimationFrame(update);
    }
  
    // Start the animation loop.
    requestAnimationFrame(update);
  }).catch(err => {
    console.error("Error loading SVGs:", err);
  });
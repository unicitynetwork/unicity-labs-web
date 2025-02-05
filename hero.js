// Load an external SVG file and parse it into a Document
async function loadSVG(url) {
    const response = await fetch(url);
    const svgText = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(svgText, "image/svg+xml");
}

// Extract line data
function getLineDataFromDocument(doc) {
    return Array.from(doc.querySelectorAll("line")).map(line => ({
        x1: parseFloat(line.getAttribute("x1")),
        y1: parseFloat(line.getAttribute("y1")),
        x2: parseFloat(line.getAttribute("x2")),
        y2: parseFloat(line.getAttribute("y2"))
    }));
}

// **Define SVG Sequence here
const svgSequence = ["1.svg", "1.svg", "2.svg", "2.svg", "3.svg"];
const uniqueSvgFiles = [...new Set(svgSequence)]; // Extract unique SVGs

// Load only unique SVGs
Promise.all(uniqueSvgFiles.map(loadSVG)).then((svgDocs) => {
    const uniqueShapes = uniqueSvgFiles.reduce((acc, name, index) => {
        acc[name] = getLineDataFromDocument(svgDocs[index]);
        return acc;
    }, {});

    const shapeSequence = svgSequence.map(name => uniqueShapes[name]);

    if (shapeSequence.length === 0 || shapeSequence[0].length === 0) {
        console.error("No valid line data found in SVGs.");
        return;
    }

    // ** Define breakpoints for morphing. Adjust to time transitions.
    const breakpoints = [0, 1/24, 7/24, 9/24, 16/24]; 

    const visibleSVG = document.getElementById("hero-svg");
    const visibleLines = [];

    // ** Assuming ll shapes have the same number of lines!
    shapeSequence[0].forEach(() => {
        const lineElem = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineElem.setAttribute("stroke", "#999");
        lineElem.setAttribute("stroke-width", 2);
        visibleSVG.appendChild(lineElem);
        visibleLines.push(lineElem);
    });

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    let previousSegment = -1;

    function getLocalProgress(progress) {
        let segmentIndex = 0;

        while (segmentIndex < breakpoints.length - 1 && progress >= breakpoints[segmentIndex + 1]) {
            segmentIndex++;
        }

        if (segmentIndex >= shapeSequence.length - 1) {
            return { localProgress: 1, startShape: shapeSequence[shapeSequence.length - 1], endShape: shapeSequence[shapeSequence.length - 1], segmentIndex };
        }

        // Normalize local progress within the current segment
        const segmentStart = breakpoints[segmentIndex];
        const segmentEnd = breakpoints[segmentIndex + 1];
        let localProgress = (progress - segmentStart) / (segmentEnd - segmentStart);

        // Apply easing
        localProgress = easeInOutCubic(localProgress);

        return { localProgress, startShape: shapeSequence[segmentIndex], endShape: shapeSequence[segmentIndex + 1], segmentIndex };
    }


    function updateLines(progress) {
        const { localProgress, startShape, endShape, segmentIndex } = getLocalProgress(progress);

        // Skip updates if the same shape is used
        if (startShape === endShape) {
            if (previousSegment !== segmentIndex) {
                for (let i = 0; i < visibleLines.length; i++) {
                    const s = startShape[i];
                    visibleLines[i].setAttribute("x1", s.x1);
                    visibleLines[i].setAttribute("y1", s.y1);
                    visibleLines[i].setAttribute("x2", s.x2);
                    visibleLines[i].setAttribute("y2", s.y2);
                }
                previousSegment = segmentIndex; 
            }
            return;
        }

        for (let i = 0; i < visibleLines.length; i++) {
            const s = startShape[i];
            const e = endShape[i];
            const x1 = lerp(s.x1, e.x1, localProgress);
            const y1 = lerp(s.y1, e.y1, localProgress);
            const x2 = lerp(s.x2, e.x2, localProgress);
            const y2 = lerp(s.y2, e.y2, localProgress);

            visibleLines[i].setAttribute("x1", x1);
            visibleLines[i].setAttribute("y1", y1);
            visibleLines[i].setAttribute("x2", x2);
            visibleLines[i].setAttribute("y2", y2);
        }

        previousSegment = segmentIndex;
    }

    // Animation
    function update() {
        const progress = Math.min(1, window.scrollY / (3 * window.innerHeight));
        updateLines(progress);
        requestAnimationFrame(update);
    }

    // Start the animation
    requestAnimationFrame(update);
}).catch(err => {
    console.error("Error loading SVGs:", err);
});

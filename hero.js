// Loads an external SVG file and parses it into a Document
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

// Load the external SVGs dynamically
const svgFiles = ["1.svg", "1.svg", "2.svg", "2.svg", "3.svg"]; 

Promise.all(svgFiles.map(loadSVG)).then((svgDocs) => {
    const shapes = svgDocs.map(getLineDataFromDocument); // Extract shape data

    // Ensure we actually loaded valid SVGs
    if (shapes.length === 0 || shapes[0].length === 0) {
        console.error("No valid line data found in SVGs.");
        return;
    }

    // Define breakpoints for morphing transitions
    const breakpoints = [0, 1/24, 7/24, 9/24, 16/24]; // Adjust these values to control morph timing

    // Create the visible line elements in our visible SVG.
    const visibleSVG = document.getElementById("hero-svg");
    const visibleLines = [];

    // (Assuming all shapes have the same number of lines.)
    shapes[0].forEach(() => {
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

    // Dynamically determine progress segmentation based on breakpoints
    function getLocalProgress(progress) {
        let segmentIndex = 0;

        // Find which segment the progress belongs to
        while (segmentIndex < breakpoints.length - 1 && progress >= breakpoints[segmentIndex + 1]) {
            segmentIndex++;
        }

        // If at the last segment, keep the last shape visible
        if (segmentIndex >= shapes.length - 1) {
            return { localProgress: 1, startShape: shapes[shapes.length - 1], endShape: shapes[shapes.length - 1] };
        }

        // Normalize local progress within the current segment
        const segmentStart = breakpoints[segmentIndex];
        const segmentEnd = breakpoints[segmentIndex + 1];
        const localProgress = (progress - segmentStart) / (segmentEnd - segmentStart);

        return { localProgress, startShape: shapes[segmentIndex], endShape: shapes[segmentIndex + 1] };
    }

    // Update the positions of the visible lines based on progress
    function updateLines(progress) {
        const { localProgress, startShape, endShape } = getLocalProgress(progress);

        // Interpolate between the corresponding endpoints
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

    // Animation loop: tie the morphing to the scroll position
    function update() {
        // Calculate a progress value between 0 and 1 based on the scroll position
        const progress = Math.min(1, window.scrollY / (3 * window.innerHeight));
        updateLines(progress);
        requestAnimationFrame(update);
    }

    // Start the animation loop
    requestAnimationFrame(update);
}).catch(err => {
    console.error("Error loading SVGs:", err);
});

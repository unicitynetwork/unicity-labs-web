// Load an external SVG file and parse it into a Document
async function loadSVG(url) {
    const response = await fetch(url);
    const svgText = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(svgText, "image/svg+xml");
}

function getLineDataFromDocument(doc) {
    return Array.from(doc.querySelectorAll("line")).map(line => ({
        x1: parseFloat(line.getAttribute("x1")),
        y1: parseFloat(line.getAttribute("y1")),
        x2: parseFloat(line.getAttribute("x2")),
        y2: parseFloat(line.getAttribute("y2"))
    }));
}

// **Define Foreground & Background SVG Sequences**
const svgSequence = ["1.svg", "1.svg", "2.svg", "2.svg", "3.svg"];
const bgSvgSequence = ["1_mesh.svg", "2_mesh.svg", "3_mesh.svg"];

const uniqueSvgFiles = [...new Set([...svgSequence, ...bgSvgSequence])];

// Load unique SVGs
Promise.all(uniqueSvgFiles.map(loadSVG)).then((svgDocs) => {
    const uniqueShapes = uniqueSvgFiles.reduce((acc, name, index) => {
        acc[name] = getLineDataFromDocument(svgDocs[index]);
        return acc;
    }, {});

    const shapeSequence = svgSequence.map(name => uniqueShapes[name]);
    const bgShapeSequence = bgSvgSequence.map(name => uniqueShapes[name]); // Background sequence

    if (!shapeSequence.length || !bgShapeSequence.length) {
        console.error("No valid line data found in SVGs.");
        return;
    }

    // **Scroll position breakpoints**
    const animationBreakpoints = [1/96, 1/3, 2/3]; // Foreground line animations
    const breakpoints = [0, 1/96, 31/96, 33/96, 64/96]; // Foreground morphing
    const bgBreakpoints = [0, 1/2, 1]; // Background morphing

    // **Setup Foreground SVG**
    const visibleSVG = document.getElementById("hero-svg");
    const visibleLines = [];

    shapeSequence[0].forEach(() => {
        const lineElem = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineElem.setAttribute("stroke", "#999");
        lineElem.setAttribute("stroke-width", 2);
        visibleSVG.appendChild(lineElem);
        visibleLines.push(lineElem);
    });

    // **Setup Background SVG (Lines, Not Rects!)**
    const backgroundSVG = document.getElementById("background-svg");
    backgroundSVG.innerHTML = "";
    const bgLines = [];

    bgShapeSequence[0].forEach(() => {
        const bgLineElem = document.createElementNS("http://www.w3.org/2000/svg", "line");
        bgLineElem.setAttribute("stroke", "#777");
        bgLineElem.setAttribute("stroke-width", 2);
        backgroundSVG.appendChild(bgLineElem);
        bgLines.push(bgLineElem);
    });

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    let previousSegment = -1;
    let lastTriggeredBreakpoint = null;

    function getLocalProgress(progress, breakpoints, shapeSequence) {
        let segmentIndex = 0;

        while (segmentIndex < breakpoints.length - 1 && progress >= breakpoints[segmentIndex + 1]) {
            segmentIndex++;
        }

        if (segmentIndex >= shapeSequence.length - 1) {
            return { localProgress: 1, startShape: shapeSequence[shapeSequence.length - 1], endShape: shapeSequence[shapeSequence.length - 1], segmentIndex };
        }

        const segmentStart = breakpoints[segmentIndex];
        const segmentEnd = breakpoints[segmentIndex + 1];
        let localProgress = (progress - segmentStart) / (segmentEnd - segmentStart);

        localProgress = easeInOutCubic(localProgress);

        return { localProgress, startShape: shapeSequence[segmentIndex], endShape: shapeSequence[segmentIndex + 1], segmentIndex };
    }

    function triggerLineAnimation(progress) {
        for (let bp of animationBreakpoints) {
            if (Math.abs(progress - bp) < 0.02 && lastTriggeredBreakpoint !== bp) { 
                lastTriggeredBreakpoint = bp; 
    
                const totalLines = visibleLines.length;
                const numAnimated = Math.ceil(totalLines * 0.25); 
                const selectedLines = visibleLines.sort(() => 0.5 - Math.random()).slice(0, numAnimated); 
    
                selectedLines.forEach((line, i) => {
                    const delay = Math.random(); 
    
                    line.style.animation = "none";
                    line.offsetHeight; 
    
                    line.style.animation = `lineGlow 0.2s ${delay}s ease-in-out`;
    
                    setTimeout(() => { 
                        line.style.animation = "none"; 
                    }, 1200);
                });
            }
        }
    }

    function updateLines(progress) {
        const { localProgress, startShape, endShape, segmentIndex } = getLocalProgress(progress, breakpoints, shapeSequence);

        triggerLineAnimation(progress);

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

    function updateBackground(progress) {
        const { localProgress, startShape, endShape } = getLocalProgress(progress, bgBreakpoints, bgShapeSequence);

        for (let i = 0; i < bgLines.length; i++) {
            const s = startShape[i];
            const e = endShape[i];
            const x1 = lerp(s.x1, e.x1, localProgress);
            const y1 = lerp(s.y1, e.y1, localProgress);
            const x2 = lerp(s.x2, e.x2, localProgress);
            const y2 = lerp(s.y2, e.y2, localProgress);

            bgLines[i].setAttribute("x1", x1);
            bgLines[i].setAttribute("y1", y1);
            bgLines[i].setAttribute("x2", x2);
            bgLines[i].setAttribute("y2", y2);
        }
    }

    function update() {
        const progress = Math.min(1, window.scrollY / (3 * window.innerHeight));
        updateLines(progress);
        updateBackground(progress);
        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}).catch(err => {
    console.error("Error loading SVGs:", err);
});

document.addEventListener('DOMContentLoaded', () => {
    // Ensure there's a canvas with id `background_canvas`. If not, create one and append it to body.
    let canvas = document.getElementById('background_canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'background_canvas';
        // Place behind everything
        canvas.style.position = 'fixed';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '0';
        canvas.style.pointerEvents = 'none';
        // Blur can be applied in CSS by site styles
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d', { alpha: true });

    // Layer configuration (front to back -> smaller parallax with higher z)
    // z is depth in [0..1], where 0 = closest, 1 = farthest
    const LAYERS = [
        { z: 0.15, count: 7, size: [0.16, 0.26], speed: [0.035, 0.06], hue: [200, 230], sat: [70, 85], light: [55, 65], alpha: 0.85 },
        { z: 0.35, count: 6, size: [0.12, 0.2],  speed: [0.025, 0.045], hue: [250, 285], sat: [65, 80], light: [50, 60], alpha: 0.8 },
        { z: 0.6,  count: 5, size: [0.1,  0.18], speed: [0.015, 0.03],  hue: [300, 335], sat: [70, 85], light: [55, 65], alpha: 0.75 },
        { z: 0.85, count: 4, size: [0.08, 0.14], speed: [0.01,  0.02],  hue: [330, 345], sat: [60, 75], light: [45, 55], alpha: 0.7 }
    ];

    // Amplitudes for parallax from inputs (in viewport pixels)
    const PARALLAX = {
        pointerAmpX: 0.25, // fraction of viewport width
        pointerAmpY: 0.2,  // fraction of viewport height
        scrollAmpY: 0.6    // fraction of viewport height
    };

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = 0, height = 0;
    let maxDim = 0;

    // Animation time
    let t = 0;

    // Camera/input state
    const input = { pointerX: 0.5, pointerY: 0.5, scrollNorm: 0 }; // normalized [-0.5..0.5] later
    const camera = { x: 0, y: 0, tx: 0, ty: 0 };
    const SMOOTH = 0.065; // camera smoothing

    // Blob instances created from LAYERS
    let blobs = [];

    function randBetween([a, b]) { return a + Math.random() * (b - a); }

    function makeBlobs() {
        blobs = [];
        LAYERS.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const baseX = Math.random(); // 0..1 of viewport width
                const baseY = Math.random(); // 0..1 of viewport height
                const sizeNorm = randBetween(layer.size); // relative to maxDim
                const hue = randBetween(layer.hue);
                const sat = randBetween(layer.sat);
                const light = randBetween(layer.light);
                const speed = randBetween(layer.speed);
                const phase = Math.random() * Math.PI * 2;
                const spin = (Math.random() < 0.5 ? -1 : 1) * randBetween([0.4, 1]);
                blobs.push({
                    layer,
                    baseX,
                    baseY,
                    sizeNorm,
                    hue, sat, light, alpha: layer.alpha,
                    speed,
                    phase,
                    spin
                });
            }
        });
        // sort by depth so far layers are drawn first (back-to-front)
        blobs.sort((a, b) => b.layer.z - a.layer.z);
    }

    function resize() {
        dpr = Math.max(1, window.devicePixelRatio || 1);
        width = Math.ceil(window.innerWidth);
        height = Math.ceil(window.innerHeight);
        maxDim = Math.max(width, height);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Rebuild blobs so radius scales reasonably on resize
        makeBlobs();
    }

    window.addEventListener('resize', resize, { passive: true });

    // Compute normalized scroll in [-0.5 .. 0.5]
    function getScrollNorm() {
        const el = document.documentElement;
        const docHeight = Math.max(document.body.scrollHeight, el.scrollHeight);
        const winH = window.innerHeight;
        if (docHeight <= winH) return 0;
        const scroll = window.scrollY || window.pageYOffset || el.scrollTop || 0;
        return (scroll / (docHeight - winH)) - 0.5;
    }

    // Input listeners
    window.addEventListener('scroll', () => {
        input.scrollNorm = getScrollNorm();
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
        // Normalize pointer to [0..1]
        input.pointerX = Math.min(1, Math.max(0, e.clientX / Math.max(1, width)));
        input.pointerY = Math.min(1, Math.max(0, e.clientY / Math.max(1, height)));
    }, { passive: true });

    // Draw one frame: many blobs organized into depth layers with true parallax
    function drawFrame() {
        // background
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Update camera target from inputs
        const px = (input.pointerX - 0.5) * (width * PARALLAX.pointerAmpX);
        const py = (input.pointerY - 0.5) * (height * PARALLAX.pointerAmpY);
        const sy = input.scrollNorm * (height * PARALLAX.scrollAmpY);
        camera.tx = px;
        camera.ty = py + sy;

        // Smooth camera
        camera.x += (camera.tx - camera.x) * SMOOTH;
        camera.y += (camera.ty - camera.y) * SMOOTH;

        // Animate time
        t += 0.016 * 60; // normalized to ~60fps units for previous tuning

        // Additive blending for blobs
        ctx.globalCompositeOperation = 'lighter';

        for (const b of blobs) {
            const z = b.layer.z; // 0..1, farther = higher z
            const parallax = (1 - z); // closer = more shift

            // Base position in pixels
            const bx = b.baseX * width;
            const by = b.baseY * height;

            // Layer-local gentle drifting (smaller for distant layers)
            const amp = maxDim * 0.05 * parallax; // drift amplitude
            const xDrift = Math.sin(b.phase + t * b.speed) * amp;
            const yDrift = Math.cos((b.phase + t * b.speed) * 0.8 * b.spin) * amp;

            // Apply camera parallax
            const x = bx + camera.x * parallax + xDrift;
            const y = by + camera.y * parallax + yDrift;

            // Blob radius scales by sizeNorm
            const radius = maxDim * b.sizeNorm;

            // Gradient
            const grad = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius);
            const lightMid = Math.max(5, b.light - 10);
            const lightOuter = Math.max(5, b.light - 35);
            grad.addColorStop(0.0, `hsla(${b.hue.toFixed(1)}, ${b.sat.toFixed(1)}%, ${b.light.toFixed(1)}%, ${b.alpha})`);
            grad.addColorStop(0.45, `hsla(${b.hue.toFixed(1)}, ${b.sat.toFixed(1)}%, ${lightMid.toFixed(1)}%, ${Math.max(0.35, b.alpha - 0.35)})`);
            grad.addColorStop(1.0, `hsla(${b.hue.toFixed(1)}, ${b.sat.toFixed(1)}%, ${lightOuter.toFixed(1)}%, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Subtle vignette to give depth
        ctx.globalCompositeOperation = 'source-over';
        const vignette = ctx.createRadialGradient(
            width / 2, height / 2, Math.min(width, height) * 0.25,
            width / 2, height / 2, Math.max(width, height) * 0.85
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }

    // animate with RAF
    let rafId = null;
    function loop() {
        drawFrame();
        rafId = requestAnimationFrame(loop);
    }

    // start
    resize();
    input.scrollNorm = getScrollNorm();
    loop();

    // expose a small API in case other scripts want to tweak effect
    window.__bgBlobs = {
        stop() { if (rafId) cancelAnimationFrame(rafId); rafId = null; },
        start() { if (!rafId) loop(); },
    };
});
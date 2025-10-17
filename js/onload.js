
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
        // Blur will be applied in CSS by the site styles (user requested)
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d', { alpha: true });

    // Parameters for the blobs
    const BLOBS = [
        { hue: 200, sat: 80, light: 55, size: 0.7, speed: 0.02, offset: 0 },
        { hue: 260, sat: 70, light: 50, size: 0.5, speed: 0.015, offset: 1000 },
        { hue: 320, sat: 75, light: 60, size: 0.6, speed: 0.01, offset: 2000 }
    ];

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = 0, height = 0;

    // keep low-frequency time so animation drifts slowly
    let t = 0;

    // Simple pseudo-random deterministic noise function (fast)
    function noise(x) {
        return (Math.sin(x * 12.9898) * 43758.5453) % 1;
    }

    function resize() {
        dpr = Math.max(1, window.devicePixelRatio || 1);
        width = Math.ceil(window.innerWidth);
        height = Math.ceil(window.innerHeight);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('resize', resize, { passive: true });

    // Parallax based on scroll position
    function getScrollParallax() {
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const winH = window.innerHeight;
        if (docHeight <= winH) return 0;
        const scroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        return (scroll / (docHeight - winH)) - 0.5; // -0.5 .. 0.5
    }

    // Draw one frame: layered soft radial gradients with additive blending
    function drawFrame() {
        // background fill (semi-transparent so CSS blur blends nicely)
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#000000ff';
        ctx.fillRect(0, 0, width, height);

        // parallax factor
        const p = getScrollParallax();

        // increase t slowly
        t += 0.16;

        // use additive blending for richer colors
        ctx.globalCompositeOperation = 'lighter';

        BLOBS.forEach((b, i) => {
            // time-based wandering positions
            const baseX = width * (0.2 + 0.6 * ((i + 1) / (BLOBS.length + 1)));
            const baseY = height * 0.5;

            const nx = Math.sin((t * b.speed) + b.offset) * 0.5 + 0.5; // 0..1
            const ny = Math.cos((t * b.speed * 0.8) + b.offset * 0.7) * 0.5 + 0.5; // 0..1

            const x = baseX + (nx - 0.5) * width * 0.25 + p * width * 0.15 * (i - 1);
            const y = baseY + (ny - 0.5) * height * 0.25;
            const radius = Math.max(width, height) * b.size * 0.6;

            // create radial gradient for smooth soft blob
            const grad = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius);
            // Use hsla() for broader compatibility (older browsers may not accept hsl with slash alpha)
            const colorA = `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0.9)`;
            const colorMid = `hsla(${b.hue}, ${b.sat}%, ${b.light - 10}%, 0.5)`;
            const colorB = `hsla(${b.hue}, ${b.sat}%, ${Math.max(10, b.light - 30)}%, 0.0)`;
            grad.addColorStop(0, colorA);
            grad.addColorStop(0.45, colorMid);
            grad.addColorStop(1, colorB);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // subtle vignette to give depth
        ctx.globalCompositeOperation = 'source-over';
        const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.8);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }

    // animate with RAF and update on scroll (parallax)
    let rafId = null;
    function loop() {
        drawFrame();
        rafId = requestAnimationFrame(loop);
    }

    // start
    resize();
    loop();

    // update immediately on scroll to keep parallax responsive
    document.body.addEventListener('scroll', (e) => {
        // no heavy work here; RAF will handle redraw but we nudge time so position reacts immediately
        t += e.deltaY > 0 ? 0.3 : -0.3;
    }, { passive: true });

    // expose a small API in case other scripts want to tweak effect
    window.__bgBlobs = {
        stop() { if (rafId) cancelAnimationFrame(rafId); rafId = null; },
        start() { if (!rafId) loop(); },
    };
});
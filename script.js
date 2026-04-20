gsap.registerPlugin(ScrollTrigger);
const frameCount = 240;
// Format frame index as 3 digits. e.g. 001, 002
const currentFrame = index => `./frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const images = [];
const imageSeq = { frame: 0 };
let loadedImages = 0;
// Handle canvas resizing to fill screen without blur
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    render();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Preload frames and DOM images to ensure zero lag
const domImages = document.querySelectorAll('img');
const totalItems = frameCount + domImages.length;
let loadedItems = 0;

function itemLoaded() {
    loadedItems++;
    let progress = Math.round((loadedItems / totalItems) * 100);
    document.getElementById("progress-bar").style.width = progress + "%";
    document.getElementById("progress-text").innerText = `Loading... ${progress}%`;

    if (loadedItems === totalItems) {
        gsap.to("#loader", {
            autoAlpha: 0,
            duration: 1,
            delay: 0.2, // Small delay for effect
            onComplete: initInteractions
        });
    }
}

// 1. Preload regular DOM images (like property cards)
domImages.forEach(img => {
    if (img.complete) {
        itemLoaded();
    } else {
        img.onload = itemLoaded;
        img.onerror = itemLoaded;
    }
});

// 2. Preload animation frames
for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images[i - 1] = img;
    
    // Force browser to decode the image fully before counting it as loaded.
    // This removes the decryption overhead during fast scrolling, eliminating lag.
    if (img.decode) {
        img.decode().then(itemLoaded).catch(itemLoaded);
    } else {
        img.onload = itemLoaded;
        img.onerror = itemLoaded;
    }
}

// Object-fit: cover drawing function
function render() {
    if (!images[imageSeq.frame]) return;
    const img = images[imageSeq.frame];
    if (!img.width) return; // Wait until decoded

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
    const renderWidth = img.width * scale;
    const renderHeight = img.height * scale;
    const x = (canvasWidth - renderWidth) / 2;
    const y = (canvasHeight - renderHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, x, y, renderWidth, renderHeight);
}

// Launch animations when loader completes
function initInteractions() {
    // First frame draw immediately
    render();

    // Initially show #phase1 wrapper fully, then stagger animate children
    gsap.set("#phase1", { opacity: 1 });
    gsap.fromTo(".phase1-ui",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.5, stagger: 0.1, ease: "power2.inOut" }
    );

    // Hero Scroll Setup
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#hero-container",
            pin: true,
            start: "top top",
            end: "+=300%",
            scrub: 1.5
        }
    });

    const totalFramesDur = frameCount - 1; // 239

    // 1) Phase 1 Fades (Starts immediately as user scrolls)
    // Focus on canvas by fading out overlay
    tl.to("#hero-overlay", { opacity: 0, duration: 60, ease: "power2.inOut" }, 0);

    // Scroll indicator hides fairly quickly
    tl.fromTo("#scroll-indicator", { opacity: 1 }, { opacity: 0, duration: 15, immediateRender: false }, 0);

    // Fade out heading, subtext, stats, and buttons together
    tl.fromTo("#hero-heading, #hero-subtext, #hero-stats, #hero-buttons", { opacity: 1 }, { opacity: 0, duration: 40, ease: "power2.inOut", immediateRender: false }, 0);

    // 2) Bind canvas image sequence to start AFTER fades complete
    tl.to(imageSeq, {
        frame: totalFramesDur,
        snap: "frame",
        ease: "none",
        duration: totalFramesDur,
        onUpdate: render
    }, 60);

    // 3) Phase 3 Final Label (Cinematic Bridge)
    tl.to("#hero-overlay", { opacity: 1, duration: 40, ease: "power2.inOut" }, 220);
    tl.to("#phase3", { opacity: 1, duration: 40, ease: "power2.inOut" }, 220);
    tl.to(".phase3-line", { width: "200px", duration: 40, ease: "power2.inOut" }, 220);


    // Card Fade-Ins on Scroll (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                gsap.to(entry.target, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".card").forEach(card => observer.observe(card));


    // Parallax Text in Section 3
    gsap.to(".left-text", {
        xPercent: -10,
        ease: "none",
        scrollTrigger: {
            trigger: "#statement",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5
        }
    });
    gsap.to(".right-text", {
        xPercent: 10,
        ease: "none",
        scrollTrigger: {
            trigger: "#statement",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5
        }
    });

    // Parallax Lines
    gsap.to(".line-left", {
        width: "35%",
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#statement",
            start: "20% bottom",
            end: "center center",
            scrub: 1.5
        }
    });
    gsap.to(".line-right", {
        width: "35%",
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#statement",
            start: "20% bottom",
            end: "center center",
            scrub: 1.5
        }
    });
}

// Navbar Background Scroll Toggle
ScrollTrigger.create({
    start: "top -50",
    end: 99999,
    toggleClass: { className: "scrolled", targets: "nav" }
});

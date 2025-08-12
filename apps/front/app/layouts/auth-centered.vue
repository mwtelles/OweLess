<template>
    <div class="auth-centered">
        <!-- Animated background layers -->
        <div class="bg" aria-hidden="true"></div>

        <!-- Centered slot -->
        <main class="center">
            <slot />
        </main>

        <footer class="legal">© {{ new Date().getFullYear() }} OweLess</footer>
    </div>
</template>

<script setup lang="ts">
const { $t } = useNuxtApp()
</script>

<style scoped>
.auth-centered {
    position: relative;
    min-height: 100svh;
    display: grid;
    grid-template-rows: 1fr auto;
    place-items: center;
    overflow: hidden;
    background: #07090b;
    /* deep black base */
}

/* Background container (no pointer events) */
.bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

/* Soft vignette/top shading (static) */
.bg::before {
    content: "";
    position: absolute;
    inset: -20vmax;
    /* bleed out to avoid edges on motion */
    background:
        radial-gradient(1100px 900px at 10% -10%, rgba(0, 0, 0, .35), transparent 60%);
    z-index: 0;
}

/* Moving green blob at bottom-right */
.bg::after {
    content: "";
    position: absolute;
    right: -28vmax;
    bottom: -40vmax;
    width: 90vmax;
    height: 90vmax;
    border-radius: 50%;
    background:
        radial-gradient(closest-side at 50% 50%,
            rgba(16, 185, 129, .38),
            rgba(16, 185, 129, .14) 45%,
            transparent 70%);
    filter: blur(20px) saturate(120%);
    will-change: transform;
    animation: blob 16s ease-in-out infinite alternate;
    z-index: 1;
}

/* Visible, organic motion */
@keyframes blob {
    0% {
        transform: translate(0, 0) scale(1) rotate(0deg);
    }

    100% {
        transform: translate(-6vmax, -5vmax) scale(1.08) rotate(4deg);
    }
}

/* Centered container */
.center {
    width: min(440px, 92vw);
    margin-inline: auto;
}

/* Footer */
.legal {
    margin: 10px 0 18px;
    font-size: .82rem;
    opacity: .65;
    color: #d1d5db;
}
</style>

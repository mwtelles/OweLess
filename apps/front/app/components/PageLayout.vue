<template>
    <section :class="['page', `max-${max}`, { 'sticky-head': stickyHead }]">
        <header class="page-head">
            <div class="titles">
                <h1 class="title">{{ title }}</h1>
                <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
            </div>

            <div class="actions">
                <slot name="actions" />
            </div>
        </header>

        <!-- Conteúdo principal -->
        <div class="page-body">
            <slot />
        </div>

        <!-- Seção opcional full-bleed -->
        <div v-if="$slots.bleed" class="page-bleed">
            <slot name="bleed" />
        </div>
    </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    title: string
    subtitle?: string
    /** Container width: lg=~1200px (default), xl=~1440px, full=100% */
    max?: 'lg' | 'xl' | 'full'
    /** Sticky header (glass) inside the content area */
    stickyHead?: boolean
}>(), {
    max: 'lg',
    stickyHead: false
})
</script>

<style scoped>
/* -------- Page vars (gutters, max widths) -------- */
.page {
    /* gutters responsivos */
    --gutter-x: clamp(12px, 3vw, 24px);
    --gutter-y: clamp(10px, 2vw, 16px);

    /* max widths por modo */
    --max-lg: 1200px;
    --max-xl: 1440px;

    width: 100%;
    margin-inline: auto;
    padding: var(--gutter-y) var(--gutter-x);
    color: #e5e7eb;
}

/* largura do container */
.page.max-lg {
    max-width: var(--max-lg);
}

.page.max-xl {
    max-width: var(--max-xl);
}

.page.max-full {
    max-width: none;
}

/* -------- Header -------- */
.page-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: .85rem;
}

/* sticky opcional com “glass” */
.sticky-head .page-head {
    position: sticky;
    top: .5rem;
    /* fica abaixo da topbar do layout */
    z-index: 5;
    padding: .5rem .6rem;
    margin: 0 0 .85rem 0;
    background: rgba(12, 14, 18, .45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(148, 163, 184, .12);
    border-radius: 12px;
}

/* Títulos */
.title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: .2px;
}

.subtitle {
    margin: .15rem 0 0 0;
    opacity: .8;
}

/* Ações: alinhamento e wraps bonitos */
.actions {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    flex-wrap: wrap;
}

.actions :deep(> * + *) {
    margin-left: 0;
}

/* -------- Body -------- */
.page-body {
    display: block;
}

/* -------- Full-bleed utility -------- */
/* Usa margens negativas baseadas nos gutters para “sangrar” até as bordas do content */
.page-bleed {
    margin-left: calc(-1 * var(--gutter-x));
    margin-right: calc(-1 * var(--gutter-x));
}

.page-bleed :deep(> *) {
    margin-left: var(--gutter-x);
    margin-right: var(--gutter-x);
}

/* -------- Responsivo -------- */
@media (max-width: 900px) {
    .page-head {
        flex-direction: column;
        align-items: flex-start;
    }
}

/* Pequenos refinamentos tipográficos em telas muito estreitas */
@media (max-width: 480px) {
    .title {
        font-size: 1.2rem;
    }
}
</style>

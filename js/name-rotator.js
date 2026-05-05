const TITLE_ROTATOR_FLAG = "__titleNameRotatorInitialized"
const EMPTY_ROTATOR_TEXT = "\u00a0"
const ROTATOR_CONFIG = Object.freeze({
    typingDelay: 75,
    deletingDelay: 45,
    holdDelay: 5000,
    switchDelay: 180,
    widthPadding: 16,
    caretWidthMultiplier: 2,
    fallbackLineHeightMultiplier: 1.2
})

function initializeTitleNameRotator() {
    if (window[TITLE_ROTATOR_FLAG]) {
        return
    }

    const titleNameElement = document.querySelector(".title-name")
    if (!titleNameElement) {
        return
    }

    const names = parseConfiguredNames(titleNameElement)
    if (names.length < 2) {
        return
    }

    const titleNameTextElement = ensureChildSpan(titleNameElement, "title-name-text")
    const titleNameCaretElement = ensureChildSpan(titleNameElement, "title-name-caret", "|")
    const textProbe = createTextProbe(titleNameElement)
    let lockedTitleWidth = 0
    let tickTimeoutId = null

    const lockTitleBox = () => {
        const metrics = measureTitleMetrics(titleNameElement, textProbe, names)
        lockedTitleWidth = metrics.width
        titleNameElement.style.width = `${metrics.width}px`
        titleNameElement.style.height = `${metrics.height}px`
        renderText()
    }
    const handleResize = () => lockTitleBox()

    let currentNameIndex = 0
    let currentText = names[0]
    let isDeleting = false

    const scheduleTick = (callback, delay) => {
        tickTimeoutId = window.setTimeout(callback, delay)
    }

    function renderText() {
        const renderedText = currentText.length > 0 ? currentText : EMPTY_ROTATOR_TEXT

        titleNameTextElement.textContent = renderedText
    }

    function tick() {
        const targetName = names[currentNameIndex]

        if (isDeleting) {
            currentText = targetName.slice(0, Math.max(0, currentText.length - 1))
            renderText()

            if (currentText.length === 0) {
                isDeleting = false
                currentNameIndex = (currentNameIndex + 1) % names.length
                scheduleTick(tick, ROTATOR_CONFIG.switchDelay)
                return
            }

            scheduleTick(tick, ROTATOR_CONFIG.deletingDelay)
            return
        }

        const nextName = names[currentNameIndex]
        currentText = nextName.slice(0, currentText.length + 1)
        renderText()

        if (currentText === nextName) {
            isDeleting = true
            scheduleTick(tick, ROTATOR_CONFIG.holdDelay)
            return
        }

        scheduleTick(tick, ROTATOR_CONFIG.typingDelay)
    }

    lockTitleBox()
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
        document.fonts.ready.then(lockTitleBox)
    }
    window.addEventListener("resize", handleResize)

    window[TITLE_ROTATOR_FLAG] = true
    renderText()
    scheduleTick(() => {
        isDeleting = true
        tick()
    }, ROTATOR_CONFIG.holdDelay)

    window.addEventListener("pagehide", () => {
        window.removeEventListener("resize", handleResize)
        if (tickTimeoutId !== null) {
            window.clearTimeout(tickTimeoutId)
        }
        if (textProbe.isConnected) {
            textProbe.remove()
        }
    }, { once: true })
}

function parseConfiguredNames(titleNameElement) {
    const rawNames = (
        titleNameElement.getAttribute("data-title-names") ||
        titleNameElement.dataset.titleNames ||
        titleNameElement.textContent ||
        ""
    )

    return rawNames
        .split(/[|,]/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
}

function ensureChildSpan(parentElement, className, text = "") {
    const existingChildSpan = parentElement.querySelector(`.${className}`)
    if (existingChildSpan) {
        return existingChildSpan
    }

    const span = document.createElement("span")
    span.className = className
    span.textContent = text

    if (parentElement.childElementCount === 0) {
        parentElement.textContent = ""
    }
    parentElement.appendChild(span)
    return span
}

function createTextProbe(titleNameElement) {
    const computed = window.getComputedStyle(titleNameElement)
    const probe = document.createElement("span")
    probe.style.position = "fixed"
    probe.style.left = "-10000px"
    probe.style.top = "-10000px"
    probe.style.visibility = "hidden"
    probe.style.pointerEvents = "none"
    probe.style.whiteSpace = "nowrap"
    probe.style.font = computed.font
    probe.style.letterSpacing = computed.letterSpacing
    probe.style.textTransform = computed.textTransform
    probe.style.lineHeight = computed.lineHeight
    document.body.appendChild(probe)
    return probe
}

function measureTextWidth(textProbe, text) {
    textProbe.textContent = text
    return textProbe.getBoundingClientRect().width
}

function measureTitleMetrics(titleNameElement, textProbe, names) {
    const computed = window.getComputedStyle(titleNameElement)
    const parsedLineHeight = parseFloat(computed.lineHeight)
    const parsedFontSize = parseFloat(computed.fontSize) || 16
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : parsedFontSize * ROTATOR_CONFIG.fallbackLineHeightMultiplier

    let widestNameWidth = 0
    for (const name of names) {
        widestNameWidth = Math.max(widestNameWidth, measureTextWidth(textProbe, name))
    }

    const measuredCaretWidth = Math.ceil(measureTextWidth(textProbe, "|"))

    return {
        width: Math.ceil(widestNameWidth + (measuredCaretWidth * ROTATOR_CONFIG.caretWidthMultiplier) + ROTATOR_CONFIG.widthPadding),
        height: Math.ceil(lineHeight)
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeTitleNameRotator)
} else {
    initializeTitleNameRotator()
}

function safeInit(stepName, initFn) {
    try {
        initFn()
    } catch (error) {
        console.error(`Initialization failed: ${stepName}`, error)
    }
}

function initializePage() {
    safeInit("header-selected-state", () => toggleHeaderSelected(window.location.hash))
    safeInit("header-functionality", loadHeaderFunctionality)
    safeInit("data-loading", loadData)
    safeInit("carousel", loadCarousel)
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage)
} else {
    initializePage()
}


function loadHeaderFunctionality() {
    const headerElements = document.querySelectorAll(".header-items a")
    headerElements.forEach((headerElement) => {
        headerElement.addEventListener("click", () => {
            headerElements.forEach((headerElement) => {
                headerElement.classList.remove("selected-header-item")
            })
            headerElement.classList.add("selected-header-item")
        })
    })
}

function toggleHeaderSelected(section) {
    switch (section) {
        case "#experience-section":
            document.querySelector("[href='#experience-section']").classList.add("selected-header-item")
            break;
        
        case "#about-section":
            document.querySelector("[href='#about-section']").classList.add("selected-header-item")
            break;
        
        default:
            document.querySelector("[href='#home-section']").classList.add("selected-header-item")
            break;
    }
}

async function loadData() {
    await Promise.all([loadExperiences(), loadProjects()])
}

async function loadProjects() {
    const projectsObject = await fetchJsonFromFile("./data/projects.json")
    const projectTemplate = document.querySelector("#project-card-template")
    const projectContainer = document.querySelector("#projects-container")

    for (let project of projectsObject) {
        const newProjectElement = projectTemplate.cloneNode(true);
        newProjectElement.id = ""
        const selector = newProjectElement.querySelectorAll("#project-card-image, #project-card-title, #project-card-description, #project-card-href, #project-card-button-text")
        for (let selectedItem of selector) {
            switch (selectedItem["id"]) {
                case "project-card-image":
                    configureProjectThumbnail(selectedItem, project)
                    break;

                case "project-card-title":
                    selectedItem.textContent = project["title"]
                    break;
                    
                case "project-card-description":
                    selectedItem.textContent = project["description"]
                    break;

                case "project-card-href":
                    selectedItem.href = project["cta_url"] || "#"
                    // Generate SVG and inject as child width/height = 24
                    break;

                case "project-card-button-text":
                    selectedItem.textContent = project["cta_text"]
                    break;

            }
        }
        projectContainer.appendChild(newProjectElement)
        const linebreakDiv = document.createElement("div")
        linebreakDiv.classList.add("secondary-vertical-linebreak")
        linebreakDiv.hidden = true
        projectContainer.appendChild(linebreakDiv)
    }

    configureProjectVisibility()


}

function configureProjectThumbnail(imageElement, project) {
    const cacheBustToken = isLocalDevelopmentHost() ? String(Date.now()) : ""
    const avifSource = appendDevCacheBust(String(project["thumbnail_avif"] || "").trim(), cacheBustToken)
    const webpSource = appendDevCacheBust(String(project["thumbnail_webp"] || "").trim(), cacheBustToken)
    const fallbackSource = appendDevCacheBust(String(project["thumbnail_url"] || "").trim(), cacheBustToken)

    imageElement.alt = project["title"] || ""
    imageElement.loading = "lazy"
    imageElement.decoding = "async"

    if (!avifSource && !webpSource) {
        imageElement.src = fallbackSource
        return
    }

    const imageParentElement = imageElement.parentElement
    if (!imageParentElement) {
        imageElement.src = fallbackSource || webpSource || avifSource
        return
    }

    const pictureElement = document.createElement("picture")
    pictureElement.classList.add("project-picture")

    if (avifSource) {
        const avifElement = document.createElement("source")
        avifElement.srcset = avifSource
        avifElement.type = "image/avif"
        pictureElement.appendChild(avifElement)
    }

    if (webpSource) {
        const webpElement = document.createElement("source")
        webpElement.srcset = webpSource
        webpElement.type = "image/webp"
        pictureElement.appendChild(webpElement)
    }

    imageElement.src = fallbackSource || webpSource || avifSource
    imageParentElement.replaceChild(pictureElement, imageElement)
    pictureElement.appendChild(imageElement)
}

function appendDevCacheBust(assetUrl, cacheBustToken) {
    if (!assetUrl || !cacheBustToken || /^https?:\/\//i.test(assetUrl)) {
        return assetUrl
    }

    const joinChar = assetUrl.includes("?") ? "&" : "?"
    return `${assetUrl}${joinChar}devcb=${encodeURIComponent(cacheBustToken)}`
}

function isLocalDevelopmentHost() {
    return window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" || window.location.hostname === "::1"
}

function configureProjectVisibility() {
    const projectsAndLinebreaks = document.querySelectorAll("#projects-container li, #projects-container .secondary-vertical-linebreak")
    let midPoint = Math.floor(projectsAndLinebreaks.length / 2);
    if (projectsAndLinebreaks.length % 2 == 0) {
        midPoint -= 1;
    }
    projectsAndLinebreaks[midPoint].hidden = false
    projectsAndLinebreaks[midPoint].classList.add("big-box")
    for (let i = 1; i < 3; i++) {
        projectsAndLinebreaks[midPoint + i].hidden = false
        projectsAndLinebreaks[midPoint - i].hidden = false        
        if (i === 2) {
            projectsAndLinebreaks[midPoint - i].classList.add("small-box")
            projectsAndLinebreaks[midPoint + i].classList.add("small-box")
        }
    }
}
   

async function loadExperiences() {
    const experiencesObject = await fetchJsonFromFile("./data/experiences.json")
    const experienceTemplate = document.querySelector("#experience-card-template")
    const experienceContainer = document.querySelector("#experiences-container")

    for (let experience of experiencesObject) {
        const newExperienceElement = experienceTemplate.cloneNode(true)
        newExperienceElement.id = ""
        newExperienceElement.hidden = false
        newExperienceElement.className = "card"

        const titleElement = newExperienceElement.querySelector(".title")
        const dateElement = newExperienceElement.querySelector(".date")
        const descriptionElement = newExperienceElement.querySelector(".experience-description")

        titleElement.textContent = experience["title"] || ""
        dateElement.textContent = experience["date"] || ""
        renderExperienceDescription(descriptionElement, experience["description"] || "")

        experienceContainer.appendChild(newExperienceElement)
    }
}

function renderExperienceDescription(containerElement, descriptionText) {
    containerElement.replaceChildren()

    const blocks = String(descriptionText)
        .split(/\n\s*\n/g)
        .map((block) => block.trim())
        .filter((block) => block.length > 0)

    for (const block of blocks) {
        const lines = block
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)

        if (lines.length === 0) {
            continue
        }

        const bulletItems = []
        let currentBulletItem = null
        let canBeBulletBlock = true

        for (const line of lines) {
            const bulletMatch = line.match(/^(?:[•*-]\s+)(.*)$/)
            if (bulletMatch) {
                if (currentBulletItem !== null) {
                    bulletItems.push(currentBulletItem)
                }
                currentBulletItem = bulletMatch[1].trim()
            } else if (currentBulletItem !== null) {
                // Treat wrapped lines as continuation of the current bullet item.
                currentBulletItem = `${currentBulletItem} ${line}`
            } else {
                canBeBulletBlock = false
                break
            }
        }

        if (canBeBulletBlock && currentBulletItem !== null) {
            bulletItems.push(currentBulletItem)
            const listElement = document.createElement("ul")
            for (const bulletItem of bulletItems) {
                const listItemElement = document.createElement("li")
                appendInlineExperienceFormatting(listItemElement, bulletItem)
                listElement.appendChild(listItemElement)
            }
            containerElement.appendChild(listElement)
            continue
        }

        const paragraphElement = document.createElement("p")
        appendInlineExperienceFormatting(paragraphElement, lines.join(" "))
        containerElement.appendChild(paragraphElement)
    }
}

function appendInlineExperienceFormatting(targetElement, rawText) {
    const text = String(rawText)
    const boldPattern = /\*\*(.+?)\*\*/g
    let match = null
    let cursor = 0

    while ((match = boldPattern.exec(text)) !== null) {
        if (match.index > cursor) {
            targetElement.append(document.createTextNode(text.slice(cursor, match.index)))
        }

        const strongElement = document.createElement("strong")
        strongElement.textContent = match[1]
        targetElement.append(strongElement)
        cursor = boldPattern.lastIndex
    }

    if (cursor < text.length) {
        targetElement.append(document.createTextNode(text.slice(cursor)))
    }
}

async function fetchJsonFromFile(path) {
    try {
        const requestOptions = isLocalDevelopmentHost() ? { cache: "no-store" } : undefined
        const response = await fetch(path, requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json(); // Parse and return JSON data
    } catch (error) {
        console.error('Error fetching JSON:', error);
        throw error; // Re-throw the error for higher-level handling
    }
}

function loadCarousel() {
    configureCarouselButtons()
}

const CAROUSEL_ANIMATION_DURATION_MS = 420
const CAROUSEL_ANIMATION_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)"
let isCarouselAnimating = false

function configureCarouselButtons() {
    const carouselButtons = document.querySelectorAll(".button")
    carouselButtons.forEach((carouselButton) => {
        carouselButton.addEventListener('click', () => carouselButtonsEventListener(carouselButton))
    })
}

function carouselButtonsEventListener(carouselButton) {
    if (isCarouselAnimating) {
        return
    }

    if (carouselButton.id == "button-previous") {
        loadPreviousProject()
    } else {
        loadNextProject()
    }
}

function loadNextProject() {
    animateCarouselShift("next")
}

function loadPreviousProject() {
    animateCarouselShift("previous")
}

function animateCarouselShift(direction) {
    const projectContainer = document.querySelector("#projects-container")
    if (!projectContainer) {
        return
    }
    const projectsBox = projectContainer.closest(".my-projects")

    const itemsBeforeUpdate = getCarouselItems()
    if (itemsBeforeUpdate.length < 5) {
        return
    }

    const lockedProjectContainerHeight = Math.ceil(projectContainer.getBoundingClientRect().height)
    projectContainer.style.height = `${lockedProjectContainerHeight}px`
    projectContainer.style.minHeight = `${lockedProjectContainerHeight}px`

    if (projectsBox) {
        const lockedProjectsBoxHeight = Math.ceil(projectsBox.getBoundingClientRect().height)
        projectsBox.style.minHeight = `${lockedProjectsBoxHeight}px`
    }

    const previousVisibleRects = new Map()
    for (const item of itemsBeforeUpdate) {
        if (item.hidden) {
            continue
        }
        previousVisibleRects.set(item, item.getBoundingClientRect())
    }

    isCarouselAnimating = true
    projectContainer.classList.add("carousel-animating")

    if (direction === "next") {
        applyNextProjectState(itemsBeforeUpdate, projectContainer)
    } else {
        applyPreviousProjectState(itemsBeforeUpdate, projectContainer)
    }

    const animations = []
    const entryOffset = direction === "next" ? 56 : -56
    const exitOffset = direction === "next" ? -56 : 56
    const itemsAfterUpdate = getCarouselItems()

    for (const item of itemsAfterUpdate) {
        if (item.hidden) {
            continue
        }

        const isDivider = isCarouselDivider(item)

        const firstRect = previousVisibleRects.get(item)
        const lastRect = item.getBoundingClientRect()

        if (firstRect) {
            const deltaX = firstRect.left - lastRect.left
            const deltaY = firstRect.top - lastRect.top
            const scaleX = isDivider || lastRect.width === 0 ? 1 : firstRect.width / lastRect.width
            const scaleY = isDivider || lastRect.height === 0 ? 1 : firstRect.height / lastRect.height
            const hasMove = Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5
            const hasScale = Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01

            if (hasMove || hasScale) {
                const moveKeyframes = isDivider
                    ? [
                        { transform: `translate(${deltaX}px, ${deltaY}px)`, opacity: 1 },
                        { transform: "translate(0, 0)", opacity: 1 }
                    ]
                    : [
                        {
                            transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
                            transformOrigin: "center center"
                        },
                        {
                            transform: "translate(0, 0) scale(1, 1)",
                            transformOrigin: "center center"
                        }
                    ]

                const moveAnimation = item.animate(moveKeyframes, {
                    duration: CAROUSEL_ANIMATION_DURATION_MS,
                    easing: CAROUSEL_ANIMATION_EASING,
                    fill: "both"
                })
                animations.push(moveAnimation.finished.catch(() => {}))
            }
        } else {
            const enterKeyframes = isDivider
                ? [
                    { opacity: 0, transform: `translateX(${entryOffset * 0.8}px)` },
                    { opacity: 1, transform: "translateX(0)" }
                ]
                : [
                    { opacity: 0, transform: `translateX(${entryOffset}px) scale(0.92)` },
                    { opacity: 1, transform: "translateX(0) scale(1)" }
                ]
            const enterAnimation = item.animate(enterKeyframes, {
                duration: CAROUSEL_ANIMATION_DURATION_MS,
                easing: CAROUSEL_ANIMATION_EASING,
                fill: "both"
            })
            animations.push(enterAnimation.finished.catch(() => {}))
        }
    }

    for (const [item, rect] of previousVisibleRects.entries()) {
        if (item.isConnected && !item.hidden) {
            continue
        }

        const isDivider = isCarouselDivider(item)

        const ghost = item.cloneNode(true)
        ghost.classList.add("carousel-ghost")
        ghost.classList.add(isDivider ? "carousel-ghost-divider" : "carousel-ghost-card")
        ghost.hidden = false
        ghost.style.left = `${rect.left}px`
        ghost.style.top = `${rect.top}px`
        ghost.style.width = `${rect.width}px`
        ghost.style.height = `${rect.height}px`
        document.body.appendChild(ghost)

        const ghostKeyframes = isDivider
            ? [
                { opacity: 1, transform: "translateX(0)" },
                { opacity: 0, transform: `translateX(${exitOffset * 0.8}px)` }
            ]
            : [
                { opacity: 1, transform: "translateX(0) scale(1)" },
                { opacity: 0, transform: `translateX(${exitOffset}px) scale(0.92)` }
            ]
        const ghostAnimation = ghost.animate(ghostKeyframes, {
            duration: CAROUSEL_ANIMATION_DURATION_MS,
            easing: CAROUSEL_ANIMATION_EASING,
            fill: "both"
        })

        const ghostAnimationPromise = ghostAnimation.finished
            .catch(() => {})
            .finally(() => ghost.remove())
        animations.push(ghostAnimationPromise)
    }

    const finishAnimation = () => {
        isCarouselAnimating = false
        projectContainer.classList.remove("carousel-animating")
        projectContainer.style.height = ""
        projectContainer.style.minHeight = ""
        if (projectsBox) {
            projectsBox.style.minHeight = ""
        }
    }

    if (animations.length === 0) {
        finishAnimation()
        return
    }

    Promise.allSettled(animations).finally(finishAnimation)
}

function getCarouselItems() {
    return Array.from(document.querySelectorAll("#projects-container li, #projects-container .secondary-vertical-linebreak"))
}

function isCarouselDivider(item) {
    return item.classList.contains("secondary-vertical-linebreak")
}

function getCarouselMidpoint(items) {
    let midpoint = Math.floor(items.length / 2)
    if (items.length % 2 === 0) {
        midpoint -= 1
    }
    return midpoint
}

function applyNextProjectState(projectsAndLinebreaks, projectContainer) {
    const midPoint = getCarouselMidpoint(projectsAndLinebreaks)

    projectsAndLinebreaks[midPoint].classList.remove("big-box")
    projectsAndLinebreaks[midPoint].classList.add("small-box")
    projectsAndLinebreaks[midPoint - 2].hidden = true
    projectsAndLinebreaks[midPoint - 1].hidden = true
    projectsAndLinebreaks[midPoint + 2].classList.add("big-box")
    projectsAndLinebreaks[midPoint + 2].classList.remove("small-box")
    projectsAndLinebreaks[midPoint + 3].hidden = false
    projectsAndLinebreaks[midPoint + 4].hidden = false
    projectsAndLinebreaks[midPoint + 4].classList.add("small-box")
    projectsAndLinebreaks[midPoint - 4].remove()
    projectsAndLinebreaks[midPoint - 3].remove()
    projectContainer.appendChild(projectsAndLinebreaks[midPoint - 4])
    projectContainer.appendChild(projectsAndLinebreaks[midPoint - 3])
}

function applyPreviousProjectState(projectsAndLinebreaks, projectContainer) {
    const midPoint = getCarouselMidpoint(projectsAndLinebreaks)

    projectsAndLinebreaks[midPoint].classList.remove("big-box")
    projectsAndLinebreaks[midPoint].classList.add("small-box")
    projectsAndLinebreaks[midPoint + 2].hidden = true
    projectsAndLinebreaks[midPoint + 1].hidden = true
    projectsAndLinebreaks[midPoint - 2].classList.add("big-box")
    projectsAndLinebreaks[midPoint - 2].classList.remove("small-box")
    projectsAndLinebreaks[midPoint - 4].classList.add("small-box")
    projectsAndLinebreaks[midPoint + 4].remove()
    projectsAndLinebreaks[midPoint + 3].remove()
    projectContainer.insertBefore(projectsAndLinebreaks[midPoint + 3], projectContainer.childNodes[0])
    projectContainer.insertBefore(projectsAndLinebreaks[midPoint + 4], projectContainer.childNodes[0])
    projectsAndLinebreaks[midPoint - 3].hidden = false
    projectsAndLinebreaks[midPoint - 4].hidden = false
}

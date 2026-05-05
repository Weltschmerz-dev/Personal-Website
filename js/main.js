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
    const avifSource = String(project["thumbnail_avif"] || "").trim()
    const webpSource = String(project["thumbnail_webp"] || "").trim()
    const fallbackSource = String(project["thumbnail_url"] || "").trim()

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
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json(); // Parse and return JSON data
    } catch (error) {
        console.error('Error fetching JSON:', error);
        throw error; // Re-throw the error for higher-level handling
    }
}


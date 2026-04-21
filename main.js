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
                    selectedItem.src = project["thumbnail_url"]
                    selectedItem.alt = project["title"]
                    break;

                case "project-card-title":
                    selectedItem.textContent = project["title"]
                    break;
                    
                case "project-card-description":
                    selectedItem.textContent = project["description"]
                    break;

                case "project-card-href":
                    selectedItem.href = project["cta_url"]
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
                listItemElement.textContent = bulletItem
                listElement.appendChild(listItemElement)
            }
            containerElement.appendChild(listElement)
            continue
        }

        const paragraphElement = document.createElement("p")
        paragraphElement.textContent = lines.join(" ")
        containerElement.appendChild(paragraphElement)
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

function loadCarousel() {
    configureCarouselButtons()
}

function configureCarouselButtons() {
    const carouselButtons = document.querySelectorAll(".button")
    carouselButtons.forEach((carouselButton) => {
        carouselButton.addEventListener('click', () => carouselButtonsEventListener(carouselButton))
    })
}

function carouselButtonsEventListener(carouselButton) {
    if (carouselButton.id == "button-previous") {
        loadPreviousProject()
    } else {
        loadNextProject()
    }
}

function loadNextProject() {
    const projectsAndLinebreaks = document.querySelectorAll("#projects-container li, #projects-container .secondary-vertical-linebreak")
    const projectContainer = document.querySelector("#projects-container")
    let midPoint = Math.floor(projectsAndLinebreaks.length / 2);
    if (projectsAndLinebreaks.length % 2 == 0) {
        midPoint -= 1;
    }
    projectsAndLinebreaks[midPoint].classList.remove("big-box")
    projectsAndLinebreaks[midPoint].classList.add("small-box")
    projectsAndLinebreaks[midPoint-2].hidden = true
    projectsAndLinebreaks[midPoint-1].hidden = true
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

function loadPreviousProject() {
    const projectsAndLinebreaks = document.querySelectorAll("#projects-container li, #projects-container .secondary-vertical-linebreak")
    const projectContainer = document.querySelector("#projects-container")
    let midPoint = Math.floor(projectsAndLinebreaks.length / 2);
    if (projectsAndLinebreaks.length % 2 == 0) {
        midPoint -= 1;
    }
    projectsAndLinebreaks[midPoint].classList.remove("big-box")
    projectsAndLinebreaks[midPoint].classList.add("small-box")
    projectsAndLinebreaks[midPoint+2].hidden = true
    projectsAndLinebreaks[midPoint+1].hidden = true
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

window.onload = function() {
    toggleHeaderSelected(window.location.hash);
    loadHeaderFunctionality();
    loadData();
    loadCarouselFunctionality();
};


function loadHeaderFunctionality() {
    headerElements = document.querySelectorAll(".header-items a")
    headerElements.forEach((headerElement) => {
        headerElement.addEventListener("click", (event) => {
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
            console.log(document.querySelector("[href='#about-section']"))
            document.querySelector("[href='#about-section']").classList.add("selected-header-item")
            break;
        
        default:
            document.querySelector("[href='#home-section']").classList.add("selected-header-item")
            break;
    }
}

async function loadData() {
    
    loadExperiences()
    loadProjects()
}

async function loadProjects() {
    projectsObject = await fetchJsonFromFile("/data/projects.json")
    projectTemplate = document.querySelector("#project-card-template")
    projectContainer = document.querySelector("#projects-container")
    newProjectElements = []

    for (let project of projectsObject) {
        newProjectElement = projectTemplate.cloneNode(true);
        newProjectElement.id = ""
        selector = newProjectElement.querySelectorAll("#project-card-image, #project-card-title, #project-card-description, #project-card-href, #project-card-button-text")
        for (let selectedItem of selector) {
            switch (selectedItem["id"]) {
                case "project-card-image":
                    selectedItem.src = project["thumbnail_url"]
                    selectedItem.alt = project["title"]
                    break;

                case "project-card-title":
                    selectedItem.innerHTML = project["title"]
                    break;
                    
                case "project-card-description":
                    selectedItem.innerHTML = project["description"]
                    break;

                case "project-card-href":
                    selectedItem.href = project["cta_url"]
                    // Generate SCG and inject as child width/height = 24
                    break;

                case "project-card-button-text":
                    selectedItem.innerHTML = project["cta_text"]
                    break;

            }
        }
        projectContainer.appendChild(newProjectElement)
        projectContainer.appendChild(<div class="secondary-vertical-linebreak"></div>)
    }


}
   

async function loadExperiences() {
    experiencesObject = await fetchJsonFromFile("/data/experiences.json")
    experienceTemplate = document.querySelector("#experience-card-template")
    experienceContainer = document.querySelector("#experiences-container")

    for (let experience of experiencesObject) {
        newExperienceElement = experienceTemplate.cloneNode(true);
        newExperienceElement.id = ""
        newExperienceElement.hidden = false
        newExperienceElement.className = "card"
        newExperienceElement.childNodes.forEach((i) => {
            // Check if the childNode is a div
            if (i.nodeName == "DIV") {
                i.childNodes.forEach((childNode) => {
                    if (childNode.nodeName == "P") {
                        childNode.innerHTML = experience["description"]
                    } else if (childNode.nodeName == "H3") {
                        if (childNode.classList == "title") {
                            childNode.innerHTML = experience["title"]
                        } else if (childNode.classList == "date") {
                            childNode.innerHTML = experience["date"]
                        }
                    }
                })
            }
        })
        experienceContainer.appendChild(newExperienceElement)
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

function loadCarouselFunctionality() {
    const carouselButtons = document.querySelectorAll(".button")
    carouselButtons.forEach((carouselButton) => {
        carouselButton.addEventListener('click', (event) => carouselButtonsEventListener(carouselButton))
    })
}

function carouselButtonsEventListener(carouselButton) {
    if (carouselButton.id == "button-previous") {
        console.log("previous thingy please")
        loadPreviousProject()
    } else {
        console.log("Next thingy please")
        loadNextProject()
    }
}

function loadPreviousProject() {
    const projectBoxes = document.querySelectorAll(".project-box")
    let classnames = []
    projectBoxes.forEach((projectBox) => {
        classnames.push(projectBox.classList.value)
    })
    // shift the classnames by -1
    classnames = classnames.concat(classnames.splice(0,1))
    projectBoxes.forEach((projectBox, index) => {
        projectBox.className = classnames[index]
    })
}

function loadNextProject() {
    const projectBoxes = document.querySelectorAll(".project-box")
    let classnames = []
    projectBoxes.forEach((projectBox) => {
        classnames.push(projectBox.classList.value)
    })
    // shift the classnames by -1
    classnames = classnames.concat(classnames.splice(0,classnames.length - 1))
    projectBoxes.forEach((projectBox, index) => {
        projectBox.className = classnames[index]
    })
}
import {parseMidi} from "midi-file"
import {decodeSysex, splitIntoPatches, getPatchName, PATCHES_PER_BANK, BANK_NAMES} from "./midi/ms2000"
import {createPatch, Patch, PatchStore} from "./state/patch-store"
import {explorerStore, synthStore} from "./state/stores"


const EMPTY_SLOT_NAME = "vacío" //Ver como se trata a futuro los huecos empty y tal, de momento nose como hacerlo⚠️


let synth_body = document.querySelector(".panel--sintetizador .panel__body")
let explorer_body = document.querySelector(".panel--explorer .panel__body")



// ========== EXPLORADOR ==========
let btn_explorer = document.getElementById("explorer__file-button")
let btn_explorer_copyAll = document.getElementById("explorer__copy-to-synth")

let file_explorer = document.getElementById("explorer__file-input") as HTMLInputElement

let explorer_divs = document.getElementsByClassName('panel__explorer')
let synth_divs = document.getElementsByClassName('panel__synth')

btn_explorer?.addEventListener("click", () => {
    open_explorer()
})

btn_explorer_copyAll?.addEventListener("click", () => copyExplorerToSynth())


file_explorer?.addEventListener("change", async () => {
    if (!file_explorer.files?.[0]) return


    let file_name = file_explorer.files?.[0].name

    //Esto lo tengo que mover, no tiene sentido que este aquí sino carga no debería de hacer rename del button ⚠️
    if (file_name && btn_explorer) {
        btn_explorer.textContent = file_name
    }

    await getFileBuffer(file_explorer.files?.[0])

})

function open_explorer() {
    file_explorer?.click()
}

//Actualmente solo para .MID, posteriormente tenemos que permitir cargar tanto .MID como .syx ,y hacer el chequeo pertinente ⚠️
async function getFileBuffer(file: File) {
    let buffer = await file.arrayBuffer()
    let bytes = new Uint8Array(buffer)

    let sysex = getCleanSysex(bytes)
    if (!sysex) return //Controlar mas adelante ⚠️

    let decodedData = decodeSysex(sysex)
    if (!decodedData) return //Controlar mas adelante ⚠️

    // Guardo los patches que hemos extraído
    explorerStore.setAll(splitIntoPatches(decodedData).map(createPatch))

    console.log(explorerStore);
    
    renderPanel(explorer_divs, explorerStore)

}

// Crea la estructura de li
function createSlot(slotId: string, patch: Patch | undefined): HTMLElement {

    //Creo el li
    const li = document.createElement("li")
    li.classList.add("preset")
    li.classList.toggle("preset--empty", !patch)
    if (patch) li.dataset.id = patch.id

    //Creo el span del id
    const spanId = document.createElement("span")
    spanId.classList.add("preset__id")
    spanId.textContent = slotId

    //Creo el span del nombre
    const spanName = document.createElement("span")
    spanName.classList.add("preset__name")
    spanName.textContent = patch ? getPatchName(patch.data) : EMPTY_SLOT_NAME

    li.appendChild(spanId)
    li.appendChild(spanName)

    return li
}

// Pinta la lista entera de un panel y regenera los 128 slots desde el store
function renderPanel(divs: HTMLCollection, store: PatchStore){
    let patches = store.getAll()

    Array.from(divs).forEach((div, bankIndex) => {
        const ul = div.querySelector("ul")
        if (!ul) return

        const bankName = BANK_NAMES[bankIndex]
        const slots: HTMLElement[] = []

        for (let i = 1; i <= PATCHES_PER_BANK; i++) {
            const slotId = `${bankName}${String(i).padStart(2, "0")}`
            slots.push(createSlot(slotId, patches[bankIndex * PATCHES_PER_BANK + i - 1]))
        }

        ul.replaceChildren(...slots)
    })
}

function copyExplorerToSynth() { //⚠️ Actualmente esto copia TODO el explorerStore, en el futuro mejorar para poder copiar de uno en uno
    let copies = explorerStore.getAll().map(patch => createPatch(patch.data))
    synthStore.setAll(copies)

    renderPanel(synth_divs, synthStore)
}


// Añadimos a los divs, un event listener. Pongo 8 en vez de 128, y asi cuando cree un <li> no tengo que añadirle un eventlistener de cada vez
for (let div of explorer_divs) {
    div.addEventListener("click", (event) => {
        let item = (event.target as HTMLElement).closest('.preset') as HTMLElement | null
        if (!item?.dataset.id) return

        let patch = explorerStore.getById(item.dataset.id)
        if (!patch) return

        console.log(item.dataset.id, getPatchName(patch.data))
    })
}

//Utilizo la librería midi-file, para obtener el sysex limpio
function getCleanSysex(bytes: Uint8Array): Uint8Array | null {
    let parsed
    try {
        parsed = parseMidi(bytes)
        console.log(parsed);
        
    } catch (error) {
        console.error("El archivo no es un .mid válido:", error)
        return null
    }

    for (let track of parsed.tracks) {
        for (let event of track) {
            if (event.type === "sysEx") {
                return new Uint8Array(event.data)
            }
        }
    }

    console.error("El .mid es válido pero no contiene ningún evento SysEx") //Esto luego hay que moverlo y usarlo en una notificación o en algun toast ⚠️
    return null
}


// Construye los 8 bancos de ambos paneles
function buildPanels(container: Element, bankClass: string){

    BANK_NAMES.forEach((x, bankIndex) => {

        //Creo el div padre
        const divBank = document.createElement("div")
        divBank.classList.add(bankClass)
        divBank.dataset.bank = x

        //Creo el h5, con el rango de slots que ocupa este banco (1-16, 17-32) ⚠️ Pensar si de verdad me es útil o solo es rizar el rizo
        const firstSlot = bankIndex * PATCHES_PER_BANK + 1
        const h5 = document.createElement("h5")
        h5.textContent = `Banco ${x}: ${firstSlot} - ${firstSlot + PATCHES_PER_BANK - 1}`

        //Creo el ul vacío y  de llenarlo se encarga renderPanel
        const ul = document.createElement("ul")

        divBank.appendChild(h5)
        divBank.appendChild(ul)

        container.appendChild(divBank)
    })
}


function init() {
    if (!synth_body || !explorer_body) return
    buildPanels(synth_body, "panel__synth")
    buildPanels(explorer_body, "panel__explorer")

    renderPanel(synth_divs, synthStore)
    renderPanel(explorer_divs, explorerStore)
}

init()
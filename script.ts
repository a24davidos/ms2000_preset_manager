import {rename} from "./utils"
import {parseMidi} from "midi-file"
import {decodeSysex, splitIntoPatches, getPatchName} from "./ms2000"
import {getPatches, setPatches, getPatchById} from "./patch-store"

// ========== EXPLORADOR ==========
let btn_explorer = document.getElementById("explorer__file-button")
let file_explorer = document.getElementById("explorer__file-input") as HTMLInputElement

let explorer_divs = document.getElementsByClassName('panel__explorer')

btn_explorer?.addEventListener("click", () => {
    open_explorer()
})

file_explorer?.addEventListener("change", async () => {
    if (!file_explorer.files?.[0]) return


    let file_name = file_explorer.files?.[0].name

    //Esto lo tengo que mover, no tiene sentido que este aquí sino carga no debería de hacer rename del button ⚠️
    if (file_name && btn_explorer) {
        rename(file_name, btn_explorer)
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
    setPatches(splitIntoPatches(decodedData))

    renderExplorer()
}

// Pinta la lista entera que se muestra en el explorador
function renderExplorer() {
    let patches = getPatches()

    // Aplano los <li class="preset"> de los 8 bancos en un único array
    let allItems = Array.from(explorer_divs).flatMap(div => Array.from(div.getElementsByClassName('preset')))

    patches.forEach((patch, i) => {
        let item = allItems[i] as HTMLElement | undefined
        if (!item) return

        item.dataset.id = patch.id

        let nameSpan = item.getElementsByClassName('preset__name')[0]
        if (nameSpan) nameSpan.textContent = getPatchName(patch.data)
    })
}

// Añadimos a los divs, un event listener. Pongo 8 en vez de 128, y asi cuando cree un <li> no tengo que añadirle un eventlistener de cada vez
for (let div of explorer_divs) {
    div.addEventListener("click", (event) => {
        let item = (event.target as HTMLElement).closest('.preset') as HTMLElement | null
        if (!item?.dataset.id) return

        let patch = getPatchById(item.dataset.id)
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

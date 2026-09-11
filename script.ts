import {rename} from "./utils"
import {parseMidi} from "midi-file"
import {decodeSysex} from "./ms2000-decoder"

// ========== EXPLORADOR ==========
let btn_explorer = document.getElementById("explorer__file-button")
let file_explorer = document.getElementById("explorer__file-input") as HTMLInputElement

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

    console.log(decodedData);
    
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

import {rename} from "./utils"

// ========== EXPLORADOR ==========
let btn_explorer = document.getElementById("explorer__file-button")
let file_explorer = document.getElementById("explorer__file-input") as HTMLInputElement

btn_explorer?.addEventListener("click", () => {
    open_explorer()
})

file_explorer?.addEventListener("change", async () => {
    if (!file_explorer.files?.[0]) return


    let file_name = file_explorer.files?.[0].name
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

    let view = new DataView(buffer)
    let bytes = new Uint8Array(buffer)

    if (!checkMThd(bytes)) {
        console.error("El archivo no es un .mid válido")
        return
    }

    let { valid, length } = parseMTrk(bytes, view)

    if (!valid) {
        console.error("MTrk no válido")
        return
    }
    let sysexBytes = getCleanSysex(bytes, length)
    if (!sysexBytes) {
        console.error("Algo no ha salido bien") //REVISAR MAS ADELANTE UN MENSAJE MAS DESCRIPTIVO⚠️
        return
    }

    console.log("SysEx extraído:", sysexBytes.length, "bytes")
}

function checkMThd(bytes: Uint8Array): boolean {
    let header = new TextDecoder("utf-8").decode(bytes.slice(0, 4))
    return header === "MThd"
}

function parseMTrk(bytes: Uint8Array, view: DataView) {
    let header = new TextDecoder("utf-8").decode(bytes.slice(14, 18))

    if (header !== "MTrk") {
        return { valid: false, length: 0 }
    }

    let length = view.getUint32(18)
  

    return { valid: true, length: length }

}

function getCleanSysex(bytes: Uint8Array, length: number): Uint8Array | null {
    let trackBytes = bytes.slice(22, 22 + length)

    let sysexStart = trackBytes.findIndex((byte) => byte === 0xF0)
    if (sysexStart === -1) {
        console.error("No se encontró el inicio del SysEx (0xF0)")
        return null
    }

    let sysexEndRelative = trackBytes.subarray(sysexStart + 1).findIndex((byte) => byte === 0xF7)
    if (sysexEndRelative === -1) {
        console.error("No se encontró el fin del SysEx (0xF7)")
        return null
    }
    let sysexEnd = sysexStart + 1 + sysexEndRelative

    // +1 en el final porque slice() no incluye el índice de fin, y queremos conservar el propio 0xF7
    return trackBytes.slice(sysexStart, sysexEnd + 1)
}
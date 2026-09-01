import {rename} from "./utils"

// ========== EXPLORADOR ==========
let btn_explorer = document.getElementById("explorer__file-button")
let file_explorer = document.getElementById("explorer__file-input") as HTMLInputElement

btn_explorer?.addEventListener("click", () => {
    open_explorer()
})

file_explorer?.addEventListener("change", () => {
    let name = file_explorer.files?.[0].name
    if (name && btn_explorer) {
        rename(name, btn_explorer)
    }
})

function open_explorer() {
    file_explorer?.click()
}


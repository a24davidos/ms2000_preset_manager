let patches: Uint8Array[] = []

function getPatches(): Uint8Array[] {
    return patches
}

function setPatches(newPatches: Uint8Array[]) {
    patches = newPatches
}


export { getPatches, setPatches }
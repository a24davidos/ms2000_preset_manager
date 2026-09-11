const PATCH_SIZE = 254 // bytes por patch
const PATCH_COUNT = 128
const NAME_LENGTH = 12 //primeros 12 bytes de cada patch son el nombre en ASCII


function splitIntoPatches(data: Uint8Array, patchSize = PATCH_SIZE, patchCount = PATCH_COUNT): Uint8Array[] {
    const patches: Uint8Array[] = []

    for (let i = 0; i < data.length; i += patchSize) {
        patches.push(data.subarray(i, i + patchSize))
    }

    return patches.slice(0, patchCount)
}

function getPatchName(patch: Uint8Array): string {
    let nameBytes = patch.slice(0, NAME_LENGTH)
    return String.fromCharCode(...nameBytes).trim()
}

export { splitIntoPatches, getPatchName }

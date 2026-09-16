type Patch = { id: string, data: Uint8Array }

let patches: Patch[] = []


let nextId = 0

function getPatches(): Patch[] {
    return patches
}


function setPatches(newPatches: Uint8Array[]) {
    patches = newPatches.map(data => ({
        id: `p${nextId++}`,
        data
    }))
}

// Resuelve el data-id de un <li> a su patch
function getPatchById(id: string): Patch | undefined {
    return patches.find(patch => patch.id === id)
}

export type { Patch }
export { getPatches, setPatches, getPatchById }

type Patch = { id: string, data: Uint8Array }

let nextId = 0

function createPatch(data: Uint8Array): Patch {
    return { id: `p${nextId++}`, data }
}

function createPatchStore() {
    let patches: Patch[] = []

    function getAll(): Patch[] {
        return [...patches]
    }

    function setAll(newPatches: Patch[]) {
        patches = [...newPatches]
    }

    function getById(id: string): Patch | undefined {
        return patches.find(patch => patch.id === id)
    }

    function add(patch: Patch) {
        patches.push(patch)
    }

    return { getAll, setAll, getById, add }
}

type PatchStore = ReturnType<typeof createPatchStore>

export type { Patch, PatchStore }
export { createPatch, createPatchStore }

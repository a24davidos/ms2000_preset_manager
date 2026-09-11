const KORG_MANUFACTURER_ID = 0x42
const MS2000_DEVICE_ID = 0x58


// Deshace el encoding 7-to-8 bit de Korg: cada grupo de 8 bytes (1 msb_byte + 7 data_byte)
function decode_korg_7bit(encoded_data: Uint8Array): Uint8Array {
    let decoded: number[] = []
    let i = 0 // posición donde empieza el grupo actual (avanza de 8 en 8)

    while ( i < encoded_data.length) {
        let msb_byte = encoded_data[i]; // El byte con los 7 bits altos sueltos de este grupo
        let remaining = encoded_data.length - (i + 1)
        let chunk_len = Math.min(7 ,remaining) // normalmente 7, menos si el último grupo viene incompleto

        for (let j = 0; j < chunk_len; j++){ // recorre cada data_byte del grupo (j = qué byte toca)
            let data_byte = encoded_data[i + 1 + j];
            let msb = (msb_byte >> (6 - j)) & 0x01; //recupera el bit 7 que le corresponde a este data_byte
            let full_byte = (msb << 7) | (data_byte & 0x7F); // reconstruye el byte original completo
            decoded.push(full_byte); //cada vuelta reconstruye un byte
        }

        i += 1 + chunk_len; // salta al siguiente grupo (msb_byte + los data_byte procesados)

    }

    return new Uint8Array(decoded)
}

function decodeSysex(rawSysex: Uint8Array): Uint8Array | null {

    if (rawSysex[0] === KORG_MANUFACTURER_ID && rawSysex[2] === MS2000_DEVICE_ID){
        let encoded_data = rawSysex.slice(4) // header MS2000: manufacturer+channel+device+function
        return decode_korg_7bit(encoded_data)
    }

    console.error("El SysEx no pertenece a un Korg MS2000")
    return null
}

export { decodeSysex }
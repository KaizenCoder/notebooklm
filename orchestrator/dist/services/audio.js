export function createAudio(_env) {
    return {
        async synthesize(_text) {
            // Simule une sortie audio binaire
            return new Uint8Array([1, 2, 3, 4]);
        }
    };
}

const fs = require("fs")
const path = require("path")

module.exports.MUSESCORE_FILE_REGEX = /\.msc(x|z)$/

// Lister mappeinnhold med absolutte pather, i stedet for bare filnavn/mappenavn
module.exports.readdirSyncAbsolute = (p) => {
    try { 
        return fs.readdirSync(p).map(it => path.resolve(p, it)) 
    } catch (e) {
        if (e.code === "ENOENT") {
            return []
        }

        throw e
    }
} 
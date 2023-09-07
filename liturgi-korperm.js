#!/usr/bin/node

const fs = require("fs")
const path = require("path")
const utils = require("./utils")
const {readdirSyncAbsolute, MUSESCORE_FILE_REGEX} = utils
const JsZip = require("jszip")
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom")

const sourcePath = path.resolve(process.argv[2])
const destPath = path.resolve(process.argv[3])

const removeAllElementsOfType = (doc, elementType, f) => {
    let idx = 0
    while (true) {
        const element = doc.getElementsByTagName(elementType)[idx]
        if (!element) {
            break
        }

        if (f && !f(element)) {
            ++idx
            continue
        }

        element.parentNode.removeChild(element)
    }
}

const removeStaffTextFromMusescoreZip = async (musescoreSourceFilePath, musescoreSourceDestPath) => {
    const zip = new JsZip()
    await zip.loadAsync(fs.readFileSync(musescoreSourceFilePath))

    const musescoreXmlFileName = Object.keys(zip.files).filter(it => /mscx$/.test(it))[0]
    const musescoreXml = (await zip.file(musescoreXmlFileName).async("nodebuffer")).toString("utf-8")
    const doc = new DOMParser().parseFromString(musescoreXml, "text/xml")
    removeAllElementsOfType(doc, "StaffText", (e) => {
        const text = e.textContent.trim()
        if (text === "Sakte" || /^rep /.test(text) || text === "Raskere" || /tone$/.test(text) || /gang$/.test(text)) {
            return false
        }
        return true
    })
    removeAllElementsOfType(doc, "TBox")
    const updatedMusescoreXml = new XMLSerializer().serializeToString(doc)
    zip.file(musescoreXmlFileName, updatedMusescoreXml)

    if (fs.statSync(musescoreSourceDestPath, {throwIfNoEntry: false})) {
        const destZip = new JsZip()
        await destZip.loadAsync(fs.readFileSync(musescoreSourceDestPath))
        const destMusescoreXml = (await destZip.file(musescoreXmlFileName).async("nodebuffer")).toString("utf-8")
        const destDoc = new DOMParser().parseFromString(destMusescoreXml, "text/xml")
        const destXml = new XMLSerializer().serializeToString(destDoc)

        if (destXml === updatedMusescoreXml) {
            return
        }
    }
    
    console.log(`*** Musescore-fil ble endret av leflinga vår, lag ny (${musescoreSourceDestPath})`)
    await new Promise((resolve, reject) => {
        zip
            .generateNodeStream({type: "nodebuffer", streamFiles: true})
            .pipe(fs.createWriteStream(musescoreSourceDestPath))
            .on("end", resolve)
    }) 
}

const musescoreFiles = readdirSyncAbsolute(sourcePath)
    .filter(it => MUSESCORE_FILE_REGEX.test(it))
    .map(it => ({src: it, dest: path.join(destPath, `${path.parse(it).name}${path.parse(it).ext}`)}))

const main = async () => {
    fs.mkdirSync(destPath, {recursive: true})


    for (const file of musescoreFiles) {
        removeStaffTextFromMusescoreZip(file.src, file.dest)
    }
}

main()

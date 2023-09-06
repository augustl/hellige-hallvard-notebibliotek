#!/usr/bin/node

const fs = require("fs")
const path = require("path")
const cp = require("child_process")

const musescoreBinPath = path.resolve(process.argv[2])
const notebibliotekPath = path.resolve(process.argv[3])
const globalOutPath = path.resolve(process.argv[4])

const writePdf = (musescorePath, pdfPath) => {
    cp.spawnSync(musescoreBinPath, ["-o", pdfPath, musescorePath], {stdio: [process.stdin, process.stdout, process.stderr]})
}

const getMappedDirectories = (p) => 
    fs.readdirSync(p)
        .map(it => {
            const fullPath = path.resolve(p, it)
            const relativeFolder = path.relative(notebibliotekPath, fullPath)
            return {
                fullPath: fullPath,
                outPath: path.resolve(globalOutPath, relativeFolder),
                isMariafest: fs.existsSync(path.join(fullPath, ".mariafest"))
            }
        })
        .filter(it => fs.lstatSync(it.fullPath).isDirectory())

const doIfMtimeChanged = (source, dest, f) => {
    if (!fs.existsSync(dest)) {
        console.log(`*** Fil finnes ikke, lages (${path.relative(notebibliotekPath, source)}) `)
        f(source, dest)
    } else if (fs.statSync(source).mtime.getTime() > fs.statSync(dest).mtime.getTime()) {
        console.log(`*** Fil har endringer, lages (${path.relative(notebibliotekPath, source)})`)
        f(source, dest)
    }
}

const filesToCleanUp = new Set()

// Gjør ikke fancy rekursive greier. Enn så lenge kan vi leve med antagelsen om en mappestruktur med maks ett nivå nøsting
const dirs = getMappedDirectories(notebibliotekPath)
    .filter(it => it.fullPath !== globalOutPath)
    .flatMap(it => [it].concat(getMappedDirectories(it.fullPath)))

for (const {fullPath, outPath} of dirs) {
    fs.mkdirSync(outPath, {recursive: true})

    // Alle filer i out-mappa er kandidater for å ryddes opp etterpå
    fs.readdirSync(outPath).map(it => path.resolve(outPath, it)).filter(it => fs.lstatSync(it).isFile()).forEach(it => filesToCleanUp.add(it))

    // Alle musescore-filer skal PDF-ifiseres
    const files = fs.readdirSync(fullPath).filter(it => /\.msc(x|z)$/.test(it))
    for (const file of files) {
        const filePath = path.resolve(fullPath, file)
        // PDF-en skal hete det samme som musescore-fila
        const pdfPath = path.resolve(outPath, `${path.parse(file).name}.pdf`)

        // PDF-er vi faktisk lager nå skal ikke ryddes opp etterpå
        filesToCleanUp.delete(pdfPath)

        doIfMtimeChanged(filePath, pdfPath, writePdf)
    }
}

const mariafestSharedPdfsPath = path.join(globalOutPath, "Datofester/Felles noter for Marias datofester")
const mariafestSharedPdfs = fs.readdirSync(mariafestSharedPdfsPath)
    .filter(it => /\.pdf$/.test(it))
    .map(it => ({path: it, fullPath: path.resolve(mariafestSharedPdfsPath, it)}))
    .filter(it => fs.statSync(it.fullPath).isFile())

for (const {outPath, isMariafest} of dirs) {
    if (!isMariafest) {
        continue
    }

    for (const pdf of mariafestSharedPdfs) {
        const pdfCopyDest = path.join(outPath, pdf.path)
        filesToCleanUp.delete(pdfCopyDest)
        doIfMtimeChanged(pdf.fullPath, pdfCopyDest, fs.copyFileSync)
    }
}


// Fjern alle løsgjenger-filer som eventuelt ligger og slenger i mappa
for (const file of filesToCleanUp) {
    console.log(`*** PDF finnes men ikke Musesecore-fil, sletter PDF (${path.relative(notebibliotekPath, file)})`)
    fs.rmSync(file)
}
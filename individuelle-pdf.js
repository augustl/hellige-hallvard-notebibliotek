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

// En samling med PDF-er som skal kopieres inn i out-mappa i visse situasjoner
const mariafestSharedPdfsPath = path.join(globalOutPath, "Datofester/Felles noter for Marias datofester")
const mariafestSharedPdfs = fs.readdirSync(mariafestSharedPdfsPath)
    .filter(it => /\.pdf$/.test(it))
    .map(it => ({fileName: it, filePath: path.resolve(mariafestSharedPdfsPath, it)}))
    // Det skal jo litt til at vi har en ting som slutter med ".pdf" og ikke er en fil, men la oss være på den sikre siden
    .filter(it => fs.statSync(it.filePath).isFile())

const getMappedDirectories = (p) => 
    fs.readdirSync(p)
        .map(folderName => path.resolve(p, folderName))
        .filter(folderPath => fs.lstatSync(folderPath).isDirectory())
        // globalOutPath kan (og er) en path inne i mappene vi driver og graver i, så sørg for at den hoppes over
        .filter(folderPath => folderPath !== globalOutPath)
        .map(folderPath => {
            const relativeFolder = path.relative(notebibliotekPath, folderPath)
            const outPath = path.resolve(globalOutPath, relativeFolder)
            const isMariafest = fs.existsSync(path.join(folderPath, ".mariafest"))
            return {
                folderPath: folderPath,
                outPath: outPath,
                copyPdfs: isMariafest ? mariafestSharedPdfs.map(it => ({source: it.filePath, dest: path.join(outPath, it.fileName)})) : [],
                allFilesInOutPath: fs.readdirSync(outPath)
                    .map(it => path.resolve(outPath, it))
                    .filter(it => fs.lstatSync(it).isFile()),
                allMusescoreFiles: fs.readdirSync(folderPath)
                    .filter(it => /\.msc(x|z)$/.test(it))
                    .map(it => ({musescoreFilePath: path.resolve(folderPath, it), pdfPath: path.resolve(outPath, `${path.parse(it).name}.pdf`)}))
            }
        })

const doIfMtimeChanged = (source, dest, f) => {
    if (!fs.existsSync(dest)) {
        console.log(`*** Fil finnes ikke, lages (${path.relative(notebibliotekPath, source)}) `)
        f(source, dest)
    } else if (fs.statSync(source).mtime.getTime() > fs.statSync(dest).mtime.getTime()) {
        console.log(`*** Fil har endringer, lages (${path.relative(notebibliotekPath, source)})`)
        f(source, dest)
    }
}

// Gjør ikke fancy rekursive greier. Enn så lenge kan vi leve med antagelsen om en mappestruktur med maks ett nivå nøsting
const dirs = getMappedDirectories(notebibliotekPath)
    .flatMap(it => [it].concat(getMappedDirectories(it.folderPath)))


// Vi lister opp _alle_ filer i output-mappene for potensiell cleanup
const filesToCleanUp = new Set(dirs.flatMap(it => it.allFilesInOutPath))
dirs
    .flatMap(it => 
        // Men alle PDF-filer som generees fra musescore skal beholdes
        it.allMusescoreFiles.flatMap(it => it.pdfPath)
        // Og det skal alle ferdig genererte PDF-er som kopieres og
        .concat(it.copyPdfs.map(it => it.dest)))
    .forEach(it => filesToCleanUp.delete(it))



for (const {outPath, allMusescoreFiles, copyPdfs} of dirs) {
    fs.mkdirSync(outPath, {recursive: true})

    for (const {musescoreFilePath, pdfPath} of allMusescoreFiles) {
        doIfMtimeChanged(musescoreFilePath, pdfPath, writePdf)
    }

    for (const {source, dest} of copyPdfs) {
        doIfMtimeChanged(source, dest, fs.copyFileSync)
    }
}

for (const file of filesToCleanUp) {
    console.log(`*** Rydder opp løsgjenger-fil (${path.relative(notebibliotekPath, file)})`)
    fs.rmSync(file)
}
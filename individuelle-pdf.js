#!/usr/bin/node

const fs = require("fs")
const path = require("path")
const cp = require("child_process")
const utils = require("./utils")
const {readdirSyncAbsolute, MUSESCORE_FILE_REGEX} = utils

const musescoreBinPath = path.resolve(process.argv[2])
const notebibliotekPath = path.resolve(process.argv[3])
const globalOutPath = path.resolve(process.argv[4])

const writePdf = (musescorePath, pdfPath) => {
    cp.spawnSync(musescoreBinPath, ["-o", pdfPath, musescorePath], {stdio: [process.stdin, process.stdout, process.stderr]})
}

const getMappedDirectories = (p) => 
    readdirSyncAbsolute(p)
        // Filer kan ta seg en bolle - vi skal finne mapper, og liste ut musescore-filer i dem
        .filter(folderPath => fs.lstatSync(folderPath).isDirectory())
        // globalOutPath kan (og er) en path inne i mappene vi driver og graver i, så sørg for at den hoppes over
        .filter(folderPath => folderPath !== globalOutPath)
        .map(folderPath => {
            // Hvis vi er i /path/to/gdrive/foo/bar, får vi her foo/bar
            const relativeFolder = path.relative(notebibliotekPath, folderPath)
            // Så ønsker vi å si at outpath er /the/global/out/path/foo/bar, sånn at PDF-ene ivaretar mappestrukturen til musescore-filene
            const outPath = path.resolve(globalOutPath, relativeFolder)


            return {
                // Hele pathen til mappa med musescore-filer
                folderPath: folderPath,
                // Mappa vi skal dumpe PDF-er til
                outPath: outPath,
                allMusescoreFiles: readdirSyncAbsolute(folderPath)
                    .filter(it => MUSESCORE_FILE_REGEX.test(it))
                    .map(it => ({musescoreFilePath: it, pdfPath: path.resolve(outPath, `${path.parse(it).name}.pdf`)}))
            }
        })

const doIfMtimeChanged = (source, dest, f) => {
    if (!fs.existsSync(dest)) {
        console.log(`*** Ut-fil finnes ikke (${path.relative(notebibliotekPath, source)}) `)
        f(source, dest)
    } else if (fs.statSync(source).mtime.getTime() > fs.statSync(dest).mtime.getTime()) {
        console.log(`*** Kildefil har endringer (${path.relative(notebibliotekPath, source)})`)
        f(source, dest)
    }
}

// Vi har lyst på alle musescore-filene i mappa på toppnivå
const dirs = getMappedDirectories(notebibliotekPath)
    // I tillegg går vi ett hakk ned, og finner alle musescore-filer i mapper under det igjen. Det får holde enn så lenge,
    // greit å slippe fancy rekursiv logikk her.
    .flatMap(it => [it].concat(getMappedDirectories(it.folderPath)))


// Vi lister opp _alle_ filer i output-mappene for potensiell cleanup
const filesToCleanUp = new Set(dirs.flatMap(dir => readdirSyncAbsolute(dir.outPath).filter(it => fs.lstatSync(it).isFile())))

dirs
    .flatMap(it => 
        // Men alle PDF-filer som generees fra musescore skal beholdes
        it.allMusescoreFiles.flatMap(it => it.pdfPath))
    .forEach(it => filesToCleanUp.delete(it))


// Nå har vi samlet inn masse data, på tide å faktisk utføre destruktive operasjoner mot resten av verden
const makeItSo = () => {
    for (const {outPath, allMusescoreFiles} of dirs) {
        fs.mkdirSync(outPath, {recursive: true})
    
        for (const {musescoreFilePath, pdfPath} of allMusescoreFiles) {
            doIfMtimeChanged(musescoreFilePath, pdfPath, writePdf)
        }

    }
    
    for (const file of filesToCleanUp) {
        console.log(`*** Rydder opp løsgjenger-fil (${path.relative(notebibliotekPath, file)})`)
        fs.rmSync(file)
    }
}

makeItSo()
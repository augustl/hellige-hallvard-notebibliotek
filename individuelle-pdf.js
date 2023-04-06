#!/usr/bin/node

const fs = require("fs")
const path = require("path")
const cp = require("child_process")

const musescoreBinPath = path.resolve(process.argv[2])
const notebibliotekPath = path.resolve(process.argv[3])
const globalOutPath = path.resolve(process.argv[4])

// Doesn't do fancy recursive stuff, for now, we assume that the folder structure is relatively flat
const dirs = fs.readdirSync(notebibliotekPath)
    .map(it => ({folder: it, fullPath:  path.resolve(notebibliotekPath, it)}))
    .filter(it => fs.lstatSync(it.fullPath).isDirectory())
    .filter(it => it.fullPath !== globalOutPath)


for (const {folder, fullPath} of dirs) {
    const outPath = path.resolve(globalOutPath, folder)

    fs.mkdirSync(outPath, {recursive: true})
    const filesToCleanUp = new Set(fs.readdirSync(outPath).map(it => path.resolve(outPath, it)))

    const files = fs.readdirSync(fullPath).filter(it => /\.mscz$/.test(it))
    for (const file of files) {
        const filePath = path.resolve(fullPath, file)
        const pdfPath = path.resolve(outPath, `${path.parse(file).name}.pdf`)
        filesToCleanUp.delete(pdfPath)

        cp.spawnSync(musescoreBinPath, ["-o", pdfPath, filePath], {stdio: [process.stdin, process.stdout, process.stderr]})
    }

    for (const file of filesToCleanUp) {
        fs.rmSync(file)
    }
}
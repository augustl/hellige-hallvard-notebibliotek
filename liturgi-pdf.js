#!/usr/bin/node

const fs = require("fs")
const path = require("path")
const cp = require("child_process")

const liturgiPath = path.resolve(process.argv[2])
const outPath =  path.resolve(process.argv[3])

const pdfs = fs.readdirSync(liturgiPath)
    // Vi skal bare ha med nummererte filer - liturgifilene er nummererte med 000, 010, osv, for å få rekkefølgen riktig i ferdig PDF
    .filter(it => /^\d+/.test(it))
    .filter(it => /\.pdf$/.test(it))
    .sort()
    .map(it => path.resolve(liturgiPath, it))

const lastChangedPdf = Math.max(...pdfs.map(it => fs.statSync(it).mtime.getTime()))
const liturgiPdfChange = fs.statSync(outPath, {throwIfNoEntry: false})?.mtime?.getTime()

if (!liturgiPdfChange || (lastChangedPdf > liturgiPdfChange)) {
    cp.spawnSync("gs", ["-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite", `-sOutputFile=${outPath}`, ...pdfs], {stdio: [process.stdin, process.stdout, process.stderr]})
} else {
    console.log("Ingen PDF-er har endret seg, lager ikke ny liturgi-pdf")
}
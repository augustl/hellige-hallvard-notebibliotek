#!/usr/bin/node

const fs = require("fs")
const path = require("path")
const cp = require("child_process")

const musescoreBinPath = path.resolve(process.argv[2])
const liturgiPath = path.resolve(process.argv[3])
const buildPath =  path.resolve(process.argv[4])
const outPath =  path.resolve(process.argv[5])

const files = fs.readdirSync(liturgiPath)
    // Vi skal bare ha med nummererte filer - liturgifilene er nummererte med 000, 010, osv, for å få rekkefølgen riktig i ferdig PDF
    .filter(it => /^\d+/.test(it))
    .sort()

for (const file of files) {
    const [_, sortKey] = file.match(/^(\d+)/)
    cp.spawnSync(musescoreBinPath, ["-o", `${buildPath}/${sortKey}.pdf`, `${liturgiPath}/${file}`], {stdio: [process.stdin, process.stdout, process.stderr]})
}


// Vår gode venn GhostScript slurper inn alle PDF-ene og lager én nydelig PDF til oss
const pdfs = fs.readdirSync(buildPath)
cp.spawnSync("gs", ["-dNOPAUSE", "-dBATCH", "-sDEVICE=pdfwrite", `-sOutputFile=${outPath}`, ...(pdfs.map(it => `${buildPath}/${it}`))], {stdio: [process.stdin, process.stdout, process.stderr]})
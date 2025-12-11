import { promises as fs } from 'fs'
import path from 'path'

const root = path.resolve(process.cwd(), 'src')

async function listFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(
        entries.map(async (e) => {
            const res = path.resolve(dir, e.name)
            if (e.isDirectory()) return listFiles(res)
            return res
        }),
    )
    return files.flat().filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
}

async function countLines(file) {
    const content = await fs.readFile(file, 'utf8')
    return content.split('\n').length
}

async function main() {
    const files = await listFiles(root)
    const rows = []
    for (const f of files) {
        const rel = path.relative(process.cwd(), f)
        const lines = await countLines(f)
        rows.push({ file: rel, lines })
    }
    rows.sort((a, b) => b.lines - a.lines)
    const jsonPath = path.resolve(process.cwd(), 'docs/code-heatmap.json')
    const csvPath = path.resolve(process.cwd(), 'docs/code-heatmap.csv')
    await fs.mkdir(path.dirname(jsonPath), { recursive: true })
    await fs.writeFile(jsonPath, JSON.stringify(rows, null, 2))
    const csv = ['file,lines', ...rows.map((r) => `${r.file},${r.lines}`)].join('\n')
    await fs.writeFile(csvPath, csv)
    console.log(`Written: ${jsonPath}\nWritten: ${csvPath}`)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})

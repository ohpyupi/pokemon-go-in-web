import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/icons/animated'
const OUT_DIR = 'public/pokemon-icons'
const FIRST_ID = 1
const LAST_ID = 151

await mkdir(OUT_DIR, { recursive: true })

let ok = 0
let skip = 0
let fail = 0

for (let id = FIRST_ID; id <= LAST_ID; id++) {
  const dest = join(OUT_DIR, `${id}.png`)

  // Skip anything already on disk (also covers re-runs after partial failures).
  if (existsSync(dest)) {
    skip++
    continue
  }

  try {
    const res = await fetch(`${BASE_URL}/${id}.png`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await writeFile(dest, Buffer.from(await res.arrayBuffer()))
    ok++
    console.log(`✓ ${id}.png`)
  } catch (err) {
    fail++
    console.error(`✗ ${id}.png — ${err instanceof Error ? err.message : String(err)}`)
  }
}

console.log(`Done: ${ok} downloaded, ${skip} skipped, ${fail} failed`)
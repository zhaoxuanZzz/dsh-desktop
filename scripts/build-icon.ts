import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(join(root, 'resources'), { recursive: true })
await sharp(join(root, 'resources', 'icon.svg')).resize(1024, 1024).png().toFile(join(root, 'resources', 'icon.png'))

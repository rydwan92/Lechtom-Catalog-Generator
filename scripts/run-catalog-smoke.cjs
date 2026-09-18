const { spawnSync } = require('node:child_process')
const path = require('node:path')
const electron = require('electron')
const script = path.join(__dirname, 'catalog-smoke.cjs')
const result = spawnSync(electron, [script], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)

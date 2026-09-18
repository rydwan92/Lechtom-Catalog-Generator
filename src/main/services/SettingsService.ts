import { app, dialog } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AppSettings } from '../../shared/types'

export class SettingsService {
  private file = join(app.getPath('userData'), 'settings.json')
  readonly root = join(app.getPath('documents'), 'LECHTOM Catalog Generator')

  constructor() {
    for (const directory of ['brands', 'backgrounds', 'decorations', 'templates']) mkdirSync(join(this.root, 'library', directory), { recursive: true })
    if (!existsSync(join(this.root, 'library', 'brands.json'))) writeFileSync(join(this.root, 'library', 'brands.json'), '{}\n', 'utf8')
  }

  get(): AppSettings {
    if (!existsSync(this.file)) return { projectsFolder: join(this.root, 'projects') }
    const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<AppSettings>
    return { projectsFolder: parsed.projectsFolder || join(this.root, 'projects') }
  }

  async selectProjectsFolder(): Promise<AppSettings | null> {
    const selection = await dialog.showOpenDialog({ title: 'Wybierz folder projektów', defaultPath: this.get().projectsFolder, properties: ['openDirectory', 'createDirectory'] })
    if (selection.canceled || !selection.filePaths[0]) return null
    const settings = { projectsFolder: selection.filePaths[0] }
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(`${this.file}.tmp`, JSON.stringify(settings, null, 2), 'utf8')
    renameSync(`${this.file}.tmp`, this.file)
    return settings
  }
}

export function nodeArtifact(opts: {
  version: string
  platform: NodeJS.Platform
  arch: string
  mirror: string | undefined
}): { url: string; archiveName: string; nodeBinaryInside: string; destFile: string } {
  const version = opts.version
  const base = (opts.mirror ?? 'https://nodejs.org/dist').replace(/\/$/, '')
  if (opts.platform === 'win32') {
    const name = `node-v${version}-win-${opts.arch}`
    return {
      url: `${base}/v${version}/${name}.zip`,
      archiveName: `${name}.zip`,
      nodeBinaryInside: `${name}/node.exe`,
      destFile: 'node.exe',
    }
  }
  const plat = opts.platform === 'darwin' ? 'darwin' : opts.platform
  const name = `node-v${version}-${plat}-${opts.arch}`
  return {
    url: `${base}/v${version}/${name}.tar.gz`,
    archiveName: `${name}.tar.gz`,
    nodeBinaryInside: `${name}/bin/node`,
    destFile: 'bin/node',
  }
}

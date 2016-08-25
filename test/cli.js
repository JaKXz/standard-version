import test from 'ava'
import { resolve } from 'path'
import { writeFileSync, readFileSync } from 'fs'
import { cd, mkdir, exec, rm, config } from 'shelljs'

const cliPath = resolve(__dirname, '..', './index.js')

test.beforeEach(() => {
  config.silent = true
  return Promise.resolve(rm('-rf', 'tmp'))
    .then(() => mkdir('tmp'))
    .then(() => cd('tmp'))
    .then(() => exec('git init'))
    .then(() => commit('root-commit'))
})

test.afterEach(() => Promise.resolve(cd('../')).then(() => rm('-rf', 'tmp')))

test('when CHANGELOG.md does not exist, its populated with commits since last tag by default', t => {
  writePackageJson('1.0.0')

  commit('feat: first commit')
  exec('git tag -a v1.0.0 -m "my awesome first commit"')
  commit('fix: patch release')

  const { code } = execCli()
  t.is(code, 0)

  const content = readFileSync('CHANGELOG.md', 'utf-8')
  t.regex(content, /patch release/)
  t.notRegex(content, /first commit/)
})

function execCli (args) {
  return exec(`node ${cliPath} ${(args || '')}`)
}

function commit (msg) {
  return exec(`git commit --allow-empty -m "${msg}"`)
}

function writePackageJson (version) {
  return writeFileSync('package.json', JSON.stringify({
    version: version
  }), 'utf-8')
}

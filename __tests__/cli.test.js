import test from 'ava'
import { resolve } from 'path'
import { writeFileSync, readFileSync } from 'fs'
import { rm, mkdir, cd, exec, pwd } from 'shelljs'

const cliPath = resolve(__dirname, '..', './index.js')

test.before(() => {
  rm('-rf', 'tmp-*')
  // config.silent = true
})

test.beforeEach(t => {
  t.context.randomizer = process.pid + Math.floor(Math.random() * 100) + 1

  return Promise.resolve(rm('-rf', `tmp-${t.context.randomizer}`))
    .then(() => mkdir(`tmp-${t.context.randomizer}`))
    .then(() => cd(`tmp-${t.context.randomizer}`))
    .then(() => exec('git init'))
    .then(() => commit('root-commit'))
})

test('when CHANGELOG.md does not exist, its populated with commits since last tag by default', t => {
  t.regex(pwd(), new RegExp(t.context.randomizer))
  writePackageJson('1.0.0')

  commit('feat: first commit')
  exec('git tag -a v1.0.0 -m "my awesome first commit"')
  commit('fix: patch release')

  t.is(execCli().code, 0)

  const content = readFileSync('CHANGELOG.md', 'utf-8')
  t.regex(content, /patch release/)
  t.notRegex(content, /first commit/)
})

test('when CHANGELOG.md does not exist, it includes all commits if --first-release is true', t => {
  t.regex(pwd(), new RegExp(t.context.randomizer))
  writePackageJson('1.0.1')

  commit('feat: first commit')
  commit('fix: patch release')
  t.is(execCli('--first-release').code, 0)

  const content = readFileSync('CHANGELOG.md', 'utf-8')
  t.regex(content, /patch release/)
  t.regex(content, /first commit/)
  t.regex(exec('git tag').stdout, /1\.0\.1/)
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

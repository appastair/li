/** Utility methods for integration tests. */

process.env.NODE_ENV = 'testing'

const sandbox = require('@architect/sandbox')
const path = require('path')
const intDir = path.join(process.cwd(), 'tests', 'integration')

/** Fake sources used by the tests. */
const sourcesPath = path.join(intDir, 'fake-sources')

const testCache = require(path.join(intDir, '_lib', 'testcache.js'))
const fakeCrawlSites = require(path.join(intDir, '_lib', 'fake-crawl-sites.js'))
const crawlerHandler = require(path.join(process.cwd(), 'src', 'events', 'crawler', 'index.js')).handler
const scraperHandler = require(path.join(process.cwd(), 'src', 'events', 'scraper', 'index.js')).handler

/** Create AWS event payload for the crawl/scrape handlers. */
function makeEventMessage (hsh) {
  return { Records: [ { Sns: { Message: JSON.stringify(hsh) } } ] }
}

/** The port for tests. */
const sandboxPort = 5555

async function setup () {
  await sandbox.start({ port: sandboxPort, quiet: true })
  testCache.setup()
  fakeCrawlSites.deleteAllFiles()
}

/** architect sandbox uses an internal server to handle events,
 * listening to the sandbox port + 1 (see
 * https://github.com/architect/sandbox/blob/master/src/sandbox/index.js,
 * search for 'process.env.ARC_EVENTS_PORT').  If the sandbox is
 * closed and events are still pending, ECONNREFUSED or ECONNRESET
 * is thrown.  If unhandled, this crashes the Node process,
 * including tape, so we'll ignore just these errors for the sake of
 * testing. */
process.on('uncaughtException', err => {
  const ignoreExceptions = [
    `connect ECONNRESET 127.0.0.1:${sandboxPort + 1}`,
    `connect ECONNREFUSED 127.0.0.1:${sandboxPort + 1}`
  ]
  if (ignoreExceptions.includes(err.message)) {
    // const msg = `(Ignoring sandbox "${err.message}" thrown during teardown)`
    // console.error(msg)
  }
  else
    throw err
})

async function teardown () {
  fakeCrawlSites.deleteAllFiles()
  testCache.teardown()
  await sandbox.end()
}

/** Write file for fake sources.
 *
 * The fake sources (in `sourcesPath`) refer to urls under localhost, eg,
 * http://localhost:5555/tests/fake-source-urls/fake/fake.json.
 * `relPath` should be the part of the URL after fake-source-urls. */
function writeFakeSourceContent (relPath, data) {
  let content = data
  if (typeof(data) !== 'string')
    content = JSON.stringify(data)

  const parts = relPath.split('/')
  const folder = parts.slice(0, parts.length - 1).join(path.sep)
  const filename = parts.slice(parts.length - 1)[0]
  fakeCrawlSites.writeFile(folder, filename, content)
}

/** Write a fake source path to relpath by copying the fixture. */
function copyFixture (relPath, fixtureFilename) {
  const parts = relPath.split('/')
  const folder = parts.slice(0, parts.length - 1).join(path.sep)
  const filename = parts.slice(parts.length - 1)[0]
  fakeCrawlSites.copyFixture(folder, filename, fixtureFilename)
}


async function crawl (sourceKey) {
  const event = makeEventMessage({ source: sourceKey, _sourcesPath: sourcesPath })
  await crawlerHandler(event)
}

async function scrape (sourceKey) {
  const event = makeEventMessage({ source: sourceKey, _sourcesPath: sourcesPath })
  const fullResult = await scraperHandler(event)
  return fullResult
}

function validateResults (t, fullResult, expected) {
  t.ok(fullResult, 'Have fullResult')
  if (!fullResult)
    return

  const actual = fullResult[0].data
  t.ok(actual, 'Have data')
  if (!actual)
    return

  t.equal(expected.length, actual.length, `Result length; got actual = ${JSON.stringify(actual, null, 2)}`)

  // Only look at fields in actual record where the keys match those
  // in expected.
  function pruneActual (actualRec, expectedRec) {
    return Object.keys(expectedRec).reduce((hsh, key) => {
      hsh[key] = actualRec[key]
      return hsh
    }, {})
  }

  const maxLen = Math.min(expected.length, actual.length)
  const inspectActual = actual.
        slice(0, maxLen).
        map((rec, index) => pruneActual(rec, expected[index]))
  expected.slice(0, maxLen).forEach((rec, index) => {
    t.deepEqual(rec, inspectActual[index], `${index} exact key matches`)
  })
}

module.exports = {
  setup,
  teardown,
  writeFakeSourceContent,
  copyFixture,
  crawl,
  scrape,
  validateResults
}

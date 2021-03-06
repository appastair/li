// Migrated from coronadatascraper, src/shared/scrapers/US/GA/index.js

const srcShared = '../../../'
const assert = require('assert')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')

const _counties = [
  'Appling County',
  'Atkinson County',
  'Bacon County',
  'Baker County',
  'Baldwin County',
  'Banks County',
  'Barrow County',
  'Bartow County',
  'Ben Hill County',
  'Berrien County',
  'Bibb County',
  'Bleckley County',
  'Brantley County',
  'Brooks County',
  'Bryan County',
  'Bulloch County',
  'Burke County',
  'Butts County',
  'Calhoun County',
  'Camden County',
  'Candler County',
  'Carroll County',
  'Catoosa County',
  'Charlton County',
  'Chatham County',
  'Chattahoochee County',
  'Chattooga County',
  'Cherokee County',
  'Clarke County',
  'Clay County',
  'Clayton County',
  'Clinch County',
  'Cobb County',
  'Coffee County',
  'Colquitt County',
  'Columbia County',
  'Cook County',
  'Coweta County',
  'Crawford County',
  'Crisp County',
  'Dade County',
  'Dawson County',
  'Decatur County',
  'DeKalb County',
  'Dodge County',
  'Dooly County',
  'Dougherty County',
  'Douglas County',
  'Early County',
  'Echols County',
  'Effingham County',
  'Elbert County',
  'Emanuel County',
  'Evans County',
  'Fannin County',
  'Fayette County',
  'Floyd County',
  'Forsyth County',
  'Franklin County',
  'Fulton County',
  'Gilmer County',
  'Glascock County',
  'Glynn County',
  'Gordon County',
  'Grady County',
  'Greene County',
  'Gwinnett County',
  'Habersham County',
  'Hall County',
  'Hancock County',
  'Haralson County',
  'Harris County',
  'Hart County',
  'Heard County',
  'Henry County',
  'Houston County',
  'Irwin County',
  'Jackson County',
  'Jasper County',
  'Jeff Davis County',
  'Jefferson County',
  'Jenkins County',
  'Johnson County',
  'Jones County',
  'Lamar County',
  'Lanier County',
  'Laurens County',
  'Lee County',
  'Liberty County',
  'Lincoln County',
  'Long County',
  'Lowndes County',
  'Lumpkin County',
  'Macon County',
  'Madison County',
  'Marion County',
  'McDuffie County',
  'McIntosh County',
  'Meriwether County',
  'Miller County',
  'Mitchell County',
  'Monroe County',
  'Montgomery County',
  'Morgan County',
  'Murray County',
  'Muscogee County',
  'Newton County',
  'Oconee County',
  'Oglethorpe County',
  'Paulding County',
  'Peach County',
  'Pickens County',
  'Pierce County',
  'Pike County',
  'Polk County',
  'Pulaski County',
  'Putnam County',
  'Quitman County',
  'Rabun County',
  'Randolph County',
  'Richmond County',
  'Rockdale County',
  'Schley County',
  'Screven County',
  'Seminole County',
  'Spalding County',
  'Stephens County',
  'Stewart County',
  'Sumter County',
  'Talbot County',
  'Taliaferro County',
  'Tattnall County',
  'Taylor County',
  'Telfair County',
  'Terrell County',
  'Thomas County',
  'Tift County',
  'Toombs County',
  'Towns County',
  'Treutlen County',
  'Troup County',
  'Turner County',
  'Twiggs County',
  'Union County',
  'Upson County',
  'Walker County',
  'Walton County',
  'Ware County',
  'Warren County',
  'Washington County',
  'Wayne County',
  'Webster County',
  'Wheeler County',
  'White County',
  'Whitfield County',
  'Wilcox County',
  'Wilkes County',
  'Wilkinson County',
  'Worth County',
]

const _countyMap = {
  Mcduffie: 'McDuffie',
  Dekalb: 'DeKalb',
  Mcintosh: 'McIntosh',
}

module.exports = {
  state: 'iso2:US-GA',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://dph.georgia.gov',
    name: 'Georgia Department of Public Health',
  },
  scrapers: [
    {
      startDate: '2020-03-21',
      crawl: [
        {
          type: 'page',
          url: 'https://dph.georgia.gov/covid-19-daily-status-report',
        },
      ],
      scrape ($) {
        let counties = []
        const $trs = $('table:contains(County):contains(Cases) tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          let name = $tr.find('td:first-child').text()
          name = _countyMap[name] || name
          let county = geography.addCounty(parse.string(name))
          const cases = parse.number($tr.find('td:nth-child(2)').text())
          if (county === 'Unknown County') {
            county = UNASSIGNED
          }
          counties.push({ county, cases })
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-27',
      crawl: [
        {
          type: 'page',
          url: async (client) => {
            const indexurl = 'https://dph.georgia.gov/covid-19-daily-status-report'
            let { body } = await client( { url: indexurl } )
            const [ ret ] = body.match(/https:\/\/(.*)\.cloudfront\.net/)
            return ret
          }
        },
      ],
      scrape ($) {
        let counties = []
        const $trs = $('*[class^="tcell"]:contains("COVID-19 Confirmed Cases By County")')
              .closest('tbody')
              .find('tr:not(:first-child,:last-child)')
        assert($trs.length > 0, 'no rows found')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          let name = $tr.find('td:first-child').text()
          name = _countyMap[name] || name
          let county = geography.addCounty(parse.string(name))
          const cases = parse.number($tr.find('td:nth-child(2)').text())
          if ([ 'Unknown County', 'Non-Georgia Resident County' ].includes(county)) {
            county = UNASSIGNED
          }
          const deaths = parse.number($tr.find('td:last-child').text())
          counties.push({ county, cases, deaths })
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-04-28',
      crawl: [
        {
          type: 'headless',
          url: 'https://ga-covid19.ondemand.sas.com/',
        },
      ],
      scrape ($) {
        // Find entries, throws if doesn't find at least one.
        const findMany = (el, selector) => {
          const ret = el.find(selector)
          if (ret.length === 0) throw new Error(`No match for ${selector}`)
          return ret
        }

        // Find the table with the headings we want.
        const desiredHeadings = 'County, Confirmed Cases, Cases per 100K, Total Deaths, Hospitalizations'
        const allTables = findMany($.root(), '.MuiTable-root.MuiTable-stickyHeader')
        let countiesTable = null
        allTables.each(function () {
          const t = $(this)
          const headings = findMany(t, 'thead > tr > th')
                .toArray()
                .map(th => {
                  return $(th).text()
                })
          if (headings.join(', ') === desiredHeadings) {
            countiesTable = t
          }
        })
        if (!countiesTable) throw new Error(`Couldn't find table with desired headings ${desiredHeadings})`)
        let results = []

        // Hold on to reference to use it in an internal function.
        const myCountyMap = _countyMap
        findMany(countiesTable, 'tbody > tr').each(function () {
          const tr = $(this)
          const cells = findMany(tr, 'td')
                .toArray()
                .map(th => {
                  return $(th).text()
                })
          if (cells.length !== 5) {
            throw new Error(`Expected 5 cells, got ${cells.length}`)
          }
          let name = cells[0]
          name = myCountyMap[name] || name
          let county = geography.addCounty(parse.string(name))
          if ([ 'Unknown County', 'Non-Georgia Resident County' ].includes(county)) {
            county = UNASSIGNED
          }
          const cases = parse.number(cells[1])
          const deaths = parse.number(cells[3])
          const hospitalized = parse.number(cells[4])
          results.push({ county, cases, deaths, hospitalized })
        })
        results.push(transform.sumData(results))
        results = geography.addEmptyRegions(results, _counties, 'county')
        return results

      }
    }
    // TODO (scrapers) This is throwing a 500 internal error on crawl.
  ]
}

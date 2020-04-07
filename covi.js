let rp = require('request-promise'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    log = console.log,
    dataPath = 'public/data/',
    isSaveToHtmlFile = false,
    isLiveHeroku = false

async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err) reject(err)
            resolve(data)
        })
    })
}

async function writeFile(fileName, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, content, function (err) {
            if (err) reject(err)
            var statusText = 'write file > ' + fileName + ' success'
            log(statusText)
            resolve(true)
        })
    })
}

function genFileName(extentionName, hasHourSuffix) {
    let d = new Date(),
        y = d.getFullYear(),
        m = (d.getMonth() + 1),
        day = d.getDate()
    return `${y}${m >= 10 ? m : '0' + m}${day >= 10 ? day : '0' + day}${hasHourSuffix ? '_' + d.getHours() + 'h' + d.getMinutes() + 'm' : ''}${extentionName}`
}

async function fetchHtmlTable(url) {
    let s = new Date()
    log('%s: fetching data...', s.toLocaleString())
    let bodyHtml = await rp(url)
        .then(function (body) {
            return body
        })
        .catch(function (err) {
            log(err)
        });
    //log(bodyHtml)
    if (isSaveToHtmlFile) {
        writeFile(dataPath + genFileName('.html'), bodyHtml)
        writeFile(dataPath + genFileName('.html', true), bodyHtml)
    }
    let e = new Date()
    log('%s: fetched data', e.toLocaleString())
    log('Total seconds: %ss', Math.floor((e.getTime() - s.getTime()) / 1000))
    return bodyHtml
}
function getHtmlTableWorldToJson(htmlBody) {
    let $ = cheerio.load(htmlBody)
    let rows = $('#main_table_countries_today tr[class="total_row_world"]')
    let row = cheerio.load(rows.eq(0).html().trim(), { xmlMode: true })
    let jsonTheWorld = genHtmlRowTableToArray(row.html().trim())
    return jsonTheWorld
}
async function genHtmlTableToJson(htmlBody) {
    let jsonCountries = {}
    let jsonCountry = {}
    let $ = cheerio.load(htmlBody)
    let jsonTheWorld = getHtmlTableWorldToJson(htmlBody)
    jsonCountries = Object.assign(jsonCountries, jsonTheWorld)
    let rows = $('#main_table_countries_today tr[style=""]')
    for (let i = 1; i < rows.length; i++) {
        let row = cheerio.load(rows.eq(i).html().trim(), { xmlMode: true })
        jsonCountry = genHtmlRowTableToArray(row.html().trim())
        jsonCountries = Object.assign(jsonCountries, jsonCountry)
    }
    let content = JSON.stringify(jsonCountries)
    //log(content)
    await writeFile(dataPath + genFileName('.json'), content)
    if(isLiveHeroku) await writeFile(dataPath + genFileName('.json', true), content)
    return content
}
const delComma = (selectorRow, i) => selectorRow.eq(i).text().trim().replace(/,+/g, '')
function genHtmlRowTableToArray(strHtmlRow) {
    let $ = cheerio.load(strHtmlRow, { xmlMode: true })
    let jsonRow = {},
        // name country
        rowKeyName = $('td').eq(0).text().trim().replace(/\s+|\n|-|\./g, '_').replace('__', '_').toLowerCase(),
        rowKeyValue = [
            //totalCases: 
            +delComma($('td'), 1),
            //newCases: 
            +delComma($('td'), 2),
            //totalDeaths: 
            +delComma($('td'), 3),
            //newDeaths: 
            +delComma($('td'), 4),
            //totalRecovered: 
            +delComma($('td'), 5),
            //activeCases: 
            +delComma($('td'), 6),
            //seriousCritical: 
            +delComma($('td'), 7),
            //totalCasesPer1MPop: 
            +delComma($('td'), 8),
            //deathsPer1MPop: 
            +delComma($('td'), 9),
            //totalTests: 
            +delComma($('td'), 10),
            //testsPer1MPop: 
            +delComma($('td'), 11),
        ]
    jsonRow[rowKeyName] = rowKeyValue
    return jsonRow
}
const WAIT_NEXT_FETCHING = 900 // 15 minutes
async function run() {
    let currentData = []
    try {
        let html = await fetchHtmlTable('https://www.worldometers.info/coronavirus/')
        currentData = await genHtmlTableToJson(html)
        log('%s: waiting after %ss', new Date().toLocaleString(), WAIT_NEXT_FETCHING)
        setTimeout(async () => await run(), WAIT_NEXT_FETCHING * 1000)
        return currentData
    } catch (error) {
        log(error)
        log('%s:Has error, waiting after %ss', new Date().toLocaleString())
        await run()
    }
}

module.exports = {
    run: run
};
/////// Main ////////
//(async () => await run())()

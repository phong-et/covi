let rp = require('request-promise'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    log = console.log,
    dataPath = 'public/data/',
    isSaveToHtmlFile = false,
    isLiveHeroku = true

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

function genFileName({ extentionName, hasHourSuffix, yesterday }) {
    let d = new Date()
    if (yesterday)
        d.setDate(d.getDate() - 1)
    let y = d.getFullYear(),
        m = (d.getMonth() + 1),
        day = d.getDate()
    return `${y}${m >= 10 ? m : '0' + m}${day >= 10 ? day : '0' + day}${hasHourSuffix ? '_' + d.getHours() + 'h' + d.getMinutes() + 'm' : ''}${extentionName}`
}

async function fetchContentPage(url) {
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
        writeFile(dataPath + genFileName({ extentionName: '.html' }), bodyHtml)
        writeFile(dataPath + genFileName({ extentionName: '.html', hasHourSuffix: true }), bodyHtml)
    }
    let e = new Date()
    log('%s: fetched data', e.toLocaleString())
    log('Total seconds: %ss', Math.floor((e.getTime() - s.getTime()) / 1000))
    return bodyHtml
}
function genHtmlToJsonOfTheWorld(htmlBody, htmlSelector) {
    let $ = cheerio.load(htmlBody)
    let rows = $(htmlSelector + ' tr[class="total_row_world"]')
    let rowOfTheWorld = cheerio.load(rows.eq(0).html().trim(), { xmlMode: true })
    let jsonTheWorld = genHtmlToJsonOfCountry(rowOfTheWorld.html().trim())
    return jsonTheWorld
}
async function genContentToJson(htmlBody, htmlSelector) {
    let jsonCountries = {}
    let jsonCountry = {}
    let $ = cheerio.load(htmlBody)
    let jsonTheWorld = genHtmlToJsonOfTheWorld(htmlBody, htmlSelector)
    jsonCountries = Object.assign(jsonCountries, jsonTheWorld)
    let rows = $(htmlSelector + ' tr[style=""]')
    for (let i = 0; i < rows.length; i++) {
        let row = cheerio.load(rows.eq(i).html().trim(), { xmlMode: true })
        jsonCountry = genHtmlToJsonOfCountry(row.html().trim())
        jsonCountries = Object.assign(jsonCountries, jsonCountry)
    }
    rows = $(htmlSelector + ' tr[style="background-color:#EAF7D5"]')
    for (let i = 0; i < rows.length; i++) {
        let row = cheerio.load(rows.eq(i).html().trim(), { xmlMode: true })
        jsonCountry = genHtmlToJsonOfCountry(row.html().trim())
        jsonCountries = Object.assign(jsonCountries, jsonCountry)
    }
    let content = JSON.stringify(jsonCountries)
    //log(content)
    return content
}
const getCaseNumber = (selectorRow, i) => selectorRow.eq(i).text().trim().replace(/,+/g, '')
function genHtmlToJsonOfCountry(strHtmlRow) {
    let $ = cheerio.load(strHtmlRow, { xmlMode: true })
    let jsonRow = {},
        // name country
        rowKeyName = $('td').eq(1).text().trim().replace(/\s+|\n|-|\./g, '_').replace('__', '_').toLowerCase(),
        rowKeyValue = [
            //totalCases: 
            +getCaseNumber($('td'), 2),
            //newCases: 
            +getCaseNumber($('td'), 3),
            //totalDeaths: 
            +getCaseNumber($('td'), 4),
            //newDeaths: 
            +getCaseNumber($('td'), 5),
            //totalRecovered: 
            +getCaseNumber($('td'), 6),
            //activeCases: 
            +getCaseNumber($('td'), 7),
            //seriousCritical: 
            +getCaseNumber($('td'), 8),
            //totalCasesPer1MPop: 
            +getCaseNumber($('td'), 9),
            //deathsPer1MPop: 
            +getCaseNumber($('td'), 10),
            //totalTests: 
            +getCaseNumber($('td'), 11),
            //testsPer1MPop: 
            +getCaseNumber($('td'), 12),
        ]
    jsonRow[rowKeyName] = rowKeyValue
    return jsonRow
}
async function fetchLatestData() {
    let content = await fetchContentPage('https://www.worldometers.info/coronavirus/')
    return await genContentToJson(content, '#main_table_countries_today')
}
async function fetchYesterdayLatestData() {
    let content = await fetchContentPage('https://www.worldometers.info/coronavirus/')
    return await genContentToJson(content, '#main_table_countries_yesterday')
}
function fhs(hexString) {
    if ((hexString.length % 2) == 0) {
        var arr = hexString.split('');
        var y = 0;
        for (var i = 0; i < hexString.length / 2; i++) {
            arr.splice(y, 0, '\\x');
            y = y + 3;
        }
        return arr.join('')
    }
    else {
        console.log('formalize failed');
    }
}
function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 16);
        if (v) str += String.fromCharCode(v);
    }
    return str;
}
let hw = [
    fhs('636f76692e'),
    fhs('70686f6e676c6f6e67646f6e67'),
    fhs('2e636f6d'),
    fhs('6c6f636174696f6e'),
    fhs('686f73746e616d65'),
    fhs('6c6f63616c686f7374'),
    fhs('68747470733a2f2f'),
    fhs('2f66657463682e706870'),
];
async function saveFileToHost({ fileName, yesterday }) {
    return await rp(hex2a(hw[6]) + hex2a(hw[0]) + hex2a(hw[1]) + hex2a(hw[2]) + hex2a(hw[7]) + '?date=' + fileName + '&yesterday=' + yesterday ? 'yesterday' : 'today')
}
const WAIT_NEXT_FETCHING = 1800 * 1000 // 30 minutes
async function run() {
    let todayData = [], yesterdayData = []
    try {
        let content = await fetchContentPage('https://www.worldometers.info/coronavirus/')
        // get today data
        todayData = await genContentToJson(content, '#main_table_countries_today')
        // get yesterday data
        yesterdayData = await genContentToJson(content, '#main_table_countries_yesterday')

        // save today data to heroku host
        await writeFile(dataPath + genFileName({ extentionName: '.json' }), todayData)
        await writeFile(dataPath + genFileName({ extentionName: '.json', yesterday: true }), yesterdayData)
        //if (!isLiveHeroku) await writeFile(dataPath + genFileName('.json', true), todayData)

        // save to pld host
        saveFileToHost({ fileName: genFileName({ extentionName: '.json' }) })
        saveFileToHost({ fileName: genFileName({ extentionName: '.json', yesterday: true }), yesterday: true })
        //if (!isLiveHeroku) saveFileToHost(genFileName('.json', true))

        log('%s: waiting after %ss', new Date().toLocaleString(), WAIT_NEXT_FETCHING)
        setTimeout(async () => await run(), WAIT_NEXT_FETCHING)
    } catch (error) {
        log(error)
        log('%s:Has error, waiting after %ss', new Date().toLocaleString())
        setTimeout(async () => await run(), WAIT_NEXT_FETCHING)
    }
}
module.exports = {
    run: run,
    fetchLatestData: fetchLatestData,
    fetchYesterdayLatestData: fetchYesterdayLatestData
};
/////// Main ////////
//(async () => log(await fetchYesterdayLatestData()))()

(function () {
    let log = console.log,
        defaultLang = 'vn',
        Chart,
        currentLanguage = localStorage.getItem('lang') || defaultLang,
        words = Languages[currentLanguage] || {},
        chartTitle = words.totalCase,
        chartSubTitle = `${words.latestUpdateAt} ${new Date().toLocaleString(currentLanguage === 'vn' ? 'vi-VN' : 'en-US')} ${words.from} worldometers.info`,
        _15_MINUTES = 1000 * 1000,
        expandedIcon = 'img/Editing-Expand-icon.png',
        collapsedIcon = 'img/Editing-Collapse-icon.png',
        globalData = [],
        selectedIcon = collapsedIcon,
        isMobile = () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerHeight > window.innerWidth
        },
        autoLoad = () => {
            let isMobileDevice = isMobile()
            if (isMobileDevice)
                $('#ddlLimitedCountry option[value=6]').prop('selected', 'selected')
            else
                $('#ddlLimitedCountry option[value=10]').prop('selected', 'selected')
            loadData(genFileName(new Date()) + '?v=' + new Date().getTime(), data => {
                globalData = data
                let limitedNumber = isMobileDevice ? 6 : 10
                chartTitle = $('#ddlCaseType option:selected').text() + ' ' + isMobileDevice ? ' ' + words.top6 : ' ' + words.top10
                if (Object.keys(globalData).length <= 1) {
                    alert(words.dataHasNotUpdateYet + ' 3')
                    drawChart([])
                }
                else drawChart(
                    mutateDataByCondition(globalData, 'totalCases', {
                        limitedNumber: limitedNumber, isIncludedTheWorld: false
                    })
                )
            })
            setTimeout(() => {
                location.reload();
            }, _15_MINUTES);
        },
        toggleSetting = (e) => {
            if (selectedIcon === collapsedIcon)
                selectedIcon = expandedIcon
            else
                selectedIcon = collapsedIcon
            if (e.parent().children().length == 2) {
                $('#imgToggle').prop('src', selectedIcon)
                e.parent().find("div").toggle();
            }
            else {
                $('#imgToggle').prop('src', selectedIcon)
                e.parent().wrapInner("<div>");
                e.appendTo(e.parent().parent());
                e.parent().find("div").toggle();
            }
        },

        fhs = function (hexString) {
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
        },
        hex2a = function (hex) {
            var str = '';
            for (var i = 0; i < hex.length; i += 2) {
                var v = parseInt(hex.substr(i, 2), 16);
                if (v) str += String.fromCharCode(v);
            }
            return str;
        },
        hw = [
            fhs('636f76692e'),            // [0]
            fhs('70686f6e676c6f6e67646f6e67'),// [1]
            fhs('2e636f6d'),              // [2]
            fhs('6c6f636174696f6e'),      // [3]
            fhs('686f73746e616d65'),      // [4]
            fhs('6c6f63616c686f7374'),    // [5]
            fhs('636f766963686172742e6865726f6b756170702e636f6d'),
            fhs('6e6f696368752e636f6d')
        ],
        switchLanguage = (lang) => {
            words = Languages[lang]
            title = $('#ddlCaseType option:selected').text() + ' ' + $('#ddlLimitedCountry option:selected').text()
            chartSubTitle = `${words.latestUpdateAt} ${new Date().toLocaleString(lang === 'vn' ? 'vi-VN' : 'en-US')} ${words.from} worldometers.info`
            $('#ddlCaseType').html(`
                <option value="totalCases" selected>${words.totalCase}</option>
                <option value="newCases">${words.newCases}</option>
                <option value="totalDeaths">${words.totalDeaths}</option>
                <option value="newDeaths">${words.newDeaths}</option>
                <option value="totalRecovered">${words.totalRecovered}</option>
                <option value="newRecovered">${words.newRecovered}</option>
                <option value="activeCases">${words.activeCases}</option>
                <option value="seriousCritical">${words.seriousCritical}</option>
                <option value="totalCasesPer1MPop">${words.totalCasesPer1MPop}</option>
                <option value="deathsPer1MPop">${words.deathsPer1MPop}</option>
                <option value="totalTests">${words.totalTests}</option>
                <option value="testsPer1MPop">${words.testsPer1MPop}</option>
                <option value="pop">${words.pop}</option>
            `)
            $('#ddlLimitedCountry').html(`
                <option value="all">${words.allCountries}</option>
                <option value="6" selected>${words.top6}</option>
                <option value="10">${words.top10}</option>
                <option value="eastSouthAsia">${words.eastSouthAsia}</option>
                <option value="middleEast">${words.middleEast}</option>
                <option value="namerica">${words.northAmerica}</option>
                <option value="samerica">${words.southAmerica}</option>
                <option value="asia">${words.asia}</option>
                <option value="euro">${words.euro}</option>
                <option value="america">${words.america}</option>
                <option value="africa">${words.africa}</option>
                <option value="oceania">${words.oceania}</option>
                <option value="20">${words.top20}</option>
                <option value="30">${words.top30}</option>
                <option value="40">${words.top40}</option>
                <option value="50">${words.top50}</option>
            `)
            $('#ddlSizeChart option[value=all]').text(words.expandChartWidth)
            $('#lblIncludeDataOfWorld').html(words.includeDataOfWorld)
            
        },
        changeFlag = (lang) => {
            $('#flagLang').removeClass(lang === 'us' ? 'vn' : 'us')
            $('#flagLang').addClass(lang)
        };
    $().ready(function () {
        toggleSetting($("fieldset legend"))
        //toggleSetting($("fieldset legend"))
        // load chart as default conditions
        changeFlag(currentLanguage === 'vn' ? 'us' : 'vn')
        switchLanguage(currentLanguage)
        autoLoad()
        let options = {
            format: 'dd/mm/yyyy',
            setDate: new Date(),
            defaultViewDate: new Date(),
            autoclose: true,
            todayHighlight: true,
        }
        $('#datepickerCovid').datepicker(options).datepicker("setDate", 'now')
        let btnViewChart = $('#btnViewChart')
        btnViewChart.click(function () {
            let caseType = $('#ddlCaseType option:selected'),
                condition = caseType.val(),
                //fileName = genFileName($('#datepickerCovid').datepicker('getDate')),
                limitedNumber = $('#ddlLimitedCountry option:selected').val(),
                isIncludedTheWorld = $('#cbIsIncludedTheWorld').is(':checked')
            chartTitle = caseType.text() + ' ' + $('#ddlLimitedCountry option:selected').text()
            if (Object.keys(globalData).length === 0) {
                alert(words.dataHasNotUpdateYet + ' 4')
                drawChart([])
            }
            else {
                let data = []
                if (limitedNumber === 'all')
                    data = mutateDataByCondition(globalData, condition, { isIncludedTheWorld: isIncludedTheWorld })
                else if (isNaN(limitedNumber)) {
                    let areaName = limitedNumber
                    data = mutateDataByCondition(globalData, condition, { isIncludedTheWorld: isIncludedTheWorld }, areaName)
                }
                else data = mutateDataByCondition(globalData, condition, { limitedNumber: +limitedNumber, isIncludedTheWorld: isIncludedTheWorld })
                drawChart(data)
            }
            Chart.reflow();
        });

        $('#cbIsIncludedTheWorld').change(() => btnViewChart.trigger('click'))
        $('#ddlLimitedCountry').change(() => btnViewChart.trigger('click'))
        $('#datepickerCovid').change(() => {
            loadData(genFileName($('#datepickerCovid').datepicker('getDate')), data => {
                globalData = data
                if (data.length === 0)
                    alert(words.dataHasNotUpdateYet + ' 1')
                else btnViewChart.trigger('click')
            })

        })
        $('#ddlSizeChart').change(() => {
            let width = $('#ddlSizeChart option:selected').val()
            $('#container').width(width ? width : '100%')
            Chart.reflow();
        })
        $('#ddlCaseType').change(() => btnViewChart.trigger('click'))

        $("fieldset legend").on('click', function () {
            toggleSetting($(this))
        })
        $('#container').click(() => {
            if (selectedIcon === collapsedIcon) {
                toggleSetting($($("fieldset legend")))
            }
        })
        $('#btnChangLang').click(function () {
            let lang = $('#flagLang').prop('class').split(' ').pop()
            localStorage.setItem('lang', lang)
            changeFlag(lang === 'us' ? 'vn' : 'us')
            switchLanguage(lang)
            autoLoad()
        })
    })
    //date is a Date() object
    function genFileName(date) {
        y = date.getFullYear(),
            m = (date.getMonth() + 1),
            day = date.getDate()
        return `${y}${m >= 10 ? m : '0' + m}${day >= 10 ? day : '0' + day}.json`
    }
    function loadData(fileName, callback) {
        if (
            window[hex2a(hw[3])][hex2a(hw[4])] === hex2a(hw[6]) 
            ||
            window[hex2a(hw[3])][hex2a(hw[4])] === hex2a(hw[5])
            ||
            window[hex2a(hw[3])][hex2a(hw[4])] === hex2a(hw[0]) + hex2a(hw[1]) + hex2a(hw[2])
            || 
            window[hex2a(hw[3])][hex2a(hw[4])] === hex2a(hw[7]))
            $.getJSON('data/' + fileName, function (json) {
                callback(json)
            }).fail(function () { alert(words.dataHasNotUpdateYet + ' 2') })
        else callback([0])
    }
    function filterCountriesByArea(areaName, countries, areas) {
        let selectedArea = areas[areaName],
            data = { "world": countries["world"] }
        for (var countryName in selectedArea)
            data[countryName] = countries[countryName]
        return data
    }
    /**
     * @param {*} data input format :
     * {
     *   "usa":[0,1,2,3,4,5,6,7,8,9]
     * }
     * @param {*} condition has 10 condition :
     *  //totalCases: 
        //newCases: 
        //totalDeaths: 
        //newDeaths: 
        //totalRecovered: 
        //activeCases: 
        //seriousCritical: 
        //totalCasesPer1MPop: 
        //deathsPer1MPop: 
        //totalTests: 
        //testsPer1MPop: 
     */
    function mutateDataByCondition(data, condition, chartCfg, areaName) {
        if (Object.keys(data).length === 0) return []
        let mutatedData = [],
            indexCondition = 0
        switch (condition) {
            case 'totalCases': indexCondition = 0; break
            case 'newCases': indexCondition = 1; break
            case 'totalDeaths': indexCondition = 2; break
            case 'newDeaths': indexCondition = 3; break
            case 'totalRecovered': indexCondition = 4; break
            case 'newRecovered': indexCondition = 5; break
            case 'activeCases': indexCondition = 6; break
            case 'seriousCritical': indexCondition = 7; break
            case 'totalCasesPer1MPop': indexCondition = 8; break
            case 'deathsPer1MPop': indexCondition = 9; break
            case 'totalTests': indexCondition = 10; break
            case 'testsPer1MPop': indexCondition = 11; break
            case 'pop': indexCondition = 12; break
        }
        let countries;
        // filter countries by area
        if (areaName)
            countries = filterCountriesByArea(areaName, data, areas)
        else countries = data
        // calc sum of all countries = number of the world
        var sum = countries["world"][indexCondition]
        for (var countryName in countries) {
            try {
                var number = countries[countryName][indexCondition]
                if (number >= 0)
                    mutatedData.push({
                        name: countryName.toUpperCase().replace(/_/g, ' '),
                        y: number,
                        percent: countryName === 'world' ? 100 : (number / sum) * 100
                    })
            } catch (error) {
                log(error)
                log(countryName)
                log(countries[countryName])
            }
        }
        if (chartCfg && !chartCfg.isIncludedTheWorld)
            mutatedData.splice(0, 1)
        mutatedData = sort(mutatedData).reverse()
        //log(mutatedData)
        if (chartCfg && chartCfg.limitedNumber) mutatedData.splice(chartCfg.limitedNumber)
        //log(mutatedData)
        return mutatedData
    }
    function sort(array, order) {
        return _u.orderBy(array, ['y'], [order ? 'asc' : order])
    }

    //log(chartTitle)
    const format = (number) => new Intl.NumberFormat(['ban', 'id']).format(number)
    const formatPercent = (number) => {
        let formatNumber = parseFloat(number).toFixed(2)
        return (formatNumber !== 'Infinity' && formatNumber <= 100 & formatNumber >= 0.01) ? formatNumber + '%' : ''
    }
    function drawChart(data) {
        Highcharts.theme = {
            chart: {},
            title: {
                style: {
                    color: '#000',
                    font: 'bold 16px "Tahoma", Verdana, sans-serif',
                    "text-transform": "uppercase"
                }
            },
            subtitle: {
                style: {
                    color: '#666666',
                    font: 'bold 12px "Arial", Verdana, sans-serif'
                }
            },
            lang: {
                thousandsSep: '.'
            }
        };
        Highcharts.setOptions(Highcharts.theme);
        Chart = Highcharts.chart('container', {
            chart: {
                type: 'column',
            },
            title: {
                text: chartTitle,
            },
            subtitle: {
                text: chartSubTitle
            },
            accessibility: {
                announceNewData: {
                    enabled: true
                },
            },
            xAxis: {
                type: 'category',
                title: {
                    text: `${words.national} <br/><br/>©️ copyright covi.phonglongdong.com`
                },
            },
            yAxis: {
                title: {
                    text: words.caseNumber
                },
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return `${formatPercent(this.point.percent)}<br/>${format(this.y)}`;
                        }
                    }
                }
            },
            tootip: false,
            series: [
                {
                    colorByPoint: true,
                    data: data,
                }
            ]
        })
    }
})()

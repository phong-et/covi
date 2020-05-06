(function () {
    let log = console.log,
        Chart,
        chartTitle = 'Tổng Ca Nhiễm',
        chartSubTitle = 'Cập nhật mới nhất lúc ' + new Date().toLocaleString('vi-VN') + ' từ worldometers.info',
        _15_MINUTES = 900 * 1000,
        expandedIcon = 'img/Editing-Expand-icon.png',
        collapsedIcon = 'img/Editing-Collapse-icon.png',
        globalData = [],
        selectedIcon = collapsedIcon,
        autoLoad = () => {
            loadData(genFileName(new Date()) + '?v=' + new Date().getTime(), data => {
                globalData = data
                if (Object.keys(globalData).length <= 1) {
                    alert('DỮ LIỆU CHƯA CẬP NHẬT')
                    drawChart([])
                }
                else drawChart(mutateDataByCondition(globalData, 'totalCases', { limitedNumber: 6, isIncludedTheWorld: false }))
            })
            setTimeout(() => {
                autoLoad()
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
        ];
    $().ready(function () {
        // load chart as default conditions
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

            chartTitle = caseType.text()
            if (Object.keys(globalData).length === 0) {
                alert('DỮ LIỆU CHƯA CẬP NHẬT')
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
                    alert('DỮ LIỆU CHƯA CẬP NHẬT')
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
            window[hex2a(hw[3])][hex2a(hw[4])] === hex2a(hw[5])
            ||
            window[hex2a(hw[3])][hex2a(hw[4])] === hex2a(hw[0]) + hex2a(hw[1]) + hex2a(hw[2]))
            $.getJSON('data/' + fileName, function (json) {
                callback(json)
            }).fail(function () { alert('DỮ LIỆU CHƯA CẬP NHẬT') })
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
            case 'activeCases': indexCondition = 5; break
            case 'seriousCritical': indexCondition = 6; break
            case 'totalCasesPer1MPop': indexCondition = 7; break
            case 'deathsPer1MPop': indexCondition = 8; break
            case 'totalTests': indexCondition = 9; break
            case 'testsPer1MPop': indexCondition = 10; break
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
        return formatNumber !== 'Infinity' ? formatNumber + '%' : formatNumber
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
                    text: 'Quốc gia <br/><br/>©️ copyright covi.phonglongdong.com'
                },
            },
            yAxis: {
                title: {
                    text: 'Số người'
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

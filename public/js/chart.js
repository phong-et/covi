let log = console.log,
    Chart,
    chartTitle = 'Ca Nhiễm Mới',
    chartSubTitle = new Date().toLocaleString('vi-VN') + ' - worldometers.info',
    _15_MINUTES = 900 * 1000,
    expandedIcon = 'http://icons.iconarchive.com/icons/icons8/ios7/16/Editing-Expand-icon.png',
    collapsedIcon = 'http://icons.iconarchive.com/icons/icons8/ios7/16/Editing-Collapse-icon.png',
    globalData = [],
    selectedIcon = collapsedIcon,
    autoLoad = () => {
        loadData(genFileName(new Date()) + '?v=' + new Date().getTime(), data => {
            globalData = data
            if (Object.keys(globalData).length === 0) {
                alert('DỮ LIỆU CHƯA CẬP NHẬT')
                drawChart([])
            }
            else drawChart(mutateDataByCondition(globalData, 'newCases', { limitedNumber: 10, isIncludedTheWorld: false }))
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
    }

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
    $.getJSON('data/' + fileName, function (json) {
        callback(json)
    }).fail(function () { alert('DỮ LIỆU CHƯA CẬP NHẬT') })
}
function filterCountriesByArea(areaName, countries) {
    return loadData('world_areas.json', function (areas) {
        let selectedArea = areas[areaName],
            data = {"world":countries["world"]}
        for (var countryName in selectedArea)
            data[countryName] = countries[countryName]
        return data
    })
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
    }
    let countries;
    // filter countries by area
    if (areaName)
        countries = filterCountriesByArea(areaName, data)
    else countries = data
    // calc sum of all countries = number of the world
    var sum = countries["world"][indexCondition]

    for (var countryName in countries) {
        var number = countries[countryName][indexCondition]
        if (number > 0)
            mutatedData.push({
                name: countryName.toUpperCase().replace(/_/g, ' '),
                y: number,
                percent: countryName === 'world' ? 100 : (number / sum) * 100
            })
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
function drawChart(data) {

    Highcharts.theme = {
        chart: {},
        title: {
            style: {
                color: '#000',
                font: 'bold 16px "Tahoma", Verdana, sans-serif'
            }
        },
        subtitle: {
            style: {
                color: '#666666',
                font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
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
                text: 'Quốc gia'
            }
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
                        return `${parseFloat(this.point.percent).toFixed(2)} %<br/>${format(this.y)}`;
                    }
                }
            }
        },
        tootip: false,
        series: [
            {
                //name: 'Quốc Gia',
                colorByPoint: true,
                data: data
            }
        ]
    })
}

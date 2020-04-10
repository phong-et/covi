let log = console.log,
    Chart,
    chartTitle = 'Ca Nhiễm Mới',
    chartSubTitle = new Date().toLocaleString() + ' - Dữ liệu sẽ cập nhật mới sau 15 phút',
    _15_MINUTES = 900 * 1000,
    autoLoad = () => {
        loadData(genFileName(new Date()) + '?v=' + new Date().getTime(), data => {
            if (data.length === 0)
                alert('DỮ LIỆU CHƯA CẬP NHẬT')
            else drawChart(mutateDataByCondition(data, 'newCases', { limitedNumber: 10, isIncludedTheWorld: false }))
        })
        setTimeout(() => {
            autoLoad()
        }, _15_MINUTES);
    };
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
            fileName = genFileName($('#datepickerCovid').datepicker('getDate')),
            limitedNumber = $('#ddlLimitedCountry option:selected').val(),
            isIncludedTheWorld = $('#cbIsIncludedTheWorld').is(':checked')

        chartTitle = caseType.text()
        loadData(fileName, data => {
            if (Object.keys(data).length === 0)
                alert('DỮ LIỆU CHƯA CẬP NHẬT')
            else {
                if (limitedNumber === 'all')
                    data = mutateDataByCondition(data, condition, { isIncludedTheWorld: isIncludedTheWorld })
                else data = mutateDataByCondition(data, condition, { limitedNumber: +limitedNumber, isIncludedTheWorld: isIncludedTheWorld })
                drawChart(data)
            }
        })
        Chart.reflow();
    });

    $('#cbIsIncludedTheWorld').change(() => btnViewChart.trigger('click'))
    $('#ddlLimitedCountry').change(() => btnViewChart.trigger('click'))
    $('#datepickerCovid').change(() => btnViewChart.trigger('click'))
    $('#ddlSizeChart').change(() => {
        let width = $('#ddlSizeChart option:selected').val()
        $('#container').width(width ? width : '100%')
        Chart.reflow();
    })
    $('#ddlCaseType').change(() => btnViewChart.trigger('click'))


    $("fieldset legend").click(function () {
        if ($(this).parent().children().length == 2) {
            $('#imgToggle').prop('src', 'http://icons.iconarchive.com/icons/icons8/ios7/16/Editing-Collapse-icon.png')
            $(this).parent().find("div").toggle();
        }
        else {
            $('#imgToggle').prop('src', 'http://icons.iconarchive.com/icons/icons8/ios7/16/Editing-Expand-icon.png')
            $(this).parent().wrapInner("<div>");
            $(this).appendTo($(this).parent().parent());
            $(this).parent().find("div").toggle();
        }
    });
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
function mutateDataByCondition(data, condition, chartConfig) {
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
    let countries = data
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
    if (chartConfig && !chartConfig.isIncludedTheWorld)
        mutatedData.splice(0, 1)
    mutatedData = sort(mutatedData).reverse()
    log(mutatedData)
    if (chartConfig && chartConfig.limitedNumber) mutatedData.splice(chartConfig.limitedNumber)
    log(mutatedData)
    return mutatedData
}
function sort(array, order) {
    return _u.orderBy(array, ['y'], [order ? 'asc' : order])
}

log(chartTitle)
const format = (number) => new Intl.NumberFormat(['ban', 'id']).format(number)
function drawChart(data) {
    Highcharts.setOptions({
        lang: {
            thousandsSep: '.'
        }
    });
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
            enabled: true
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
                name: 'Dữ liệu lấy từ: https://www.worldometers.info/coronavirus/ ',
                colorByPoint: true,
                data: data
            }
        ]
    })
}

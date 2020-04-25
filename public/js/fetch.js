(function () {
    let log = console.log,
        seconds = 1800 * 1000
    function genFileName(extentionName, hasHourSuffix) {
        let d = new Date(),
            y = d.getFullYear(),
            m = (d.getMonth() + 1),
            day = d.getDate()
        return `${y}${m >= 10 ? m : '0' + m}${day >= 10 ? day : '0' + day}${hasHourSuffix ? '_' + d.getHours() + 'h' + d.getMinutes() + 'm' : ''}${extentionName}`
    }
    function fetch() {
        $.ajax({
            url: 'fetch.php',
            type: 'GET',
            data: { date: genFileName('.json', true) },
            success: function (responseText) {
                try {
                    log(responseText)
                    setTimeout(function () { fetch() }, seconds)
                } catch (e) {
                    log(e)
                    setTimeout(function () { fetch() }, seconds)
                }
            },
            error: function (err) {
                log(err)
                setTimeout(function () { fetch() }, seconds)
            }
        });
    }
    fetch()
})()
(function () {
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
            success: function (isOpen) {
                try {
                    console.log(isOpen)
                } catch (e) {
                    console.log(e)
                }
            },
            error: function (err) {
                console.log(err)
            }
        });
    }
})()
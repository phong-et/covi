(function () {
    function fetch() {
        $.ajax({
            url: 'fetch.php',
            type: 'GET',
            data: { cmd: 'get-latest-data' },
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
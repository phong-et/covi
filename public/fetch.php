<?php
    @$date = $_GET["date"];
    if($date)
    {
        $ch = curl_init("http://covichart.herokuapp.com/latest");
        $fp = fopen("data/$date", "w");

        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_HEADER, 0);

        curl_exec($ch);
        if(curl_error($ch)) {
            fwrite($fp, curl_error($ch));
        }
        curl_close($ch);
        fclose($fp);
        echo "true";
    }
    else
        echo "Miss date param"
?>
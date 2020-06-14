<?php
    $date = $_GET["date"];
    $yesterday = $_GET["yesterday"];
    $url = $yesterday == "yesterday" ? "http://covichart.herokuapp.com/yesterday" : "http://covichart.herokuapp.com/latest"
    if($date) 
    {
        $ch = curl_init($url);
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
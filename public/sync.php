<?php
    $date = $_POST["date"];
    $data =  $_POST["data"];
    echo $date . "-";
    if($date) 
    {
        $file = fopen("data/$date", "w");
        echo fwrite($file, $data);
        fclose($file);
    }
    else
        echo "Miss date param"
?>
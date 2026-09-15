<?php
echo "Testing explorer...\n";
$path = "C:\\";
$cmd = 'explorer "' . $path . '"';
echo "Running: $cmd\n";
exec($cmd, $output, $return_var);
echo "Result: $return_var\n";
print_r($output);

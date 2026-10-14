<?php
// dl.php — отдача вложений формы заявки НА СКАЧИВАНИЕ.
// Статикой на Beget управляет nginx, директивы .htaccess на неё не
// действуют, поэтому файлы с заголовком Content-Disposition: attachment
// отдаёт этот скрипт.

// Строгий формат f: <32 hex>/<16 hex>.<расширение из белого списка> —
// path traversal через параметр невозможен
if (!isset($_GET['f'])) { http_response_code(404); exit; }
$f = (string) $_GET['f'];
if (!preg_match('/^[a-f0-9]{32}\/[a-f0-9]{16}\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|odt|ods|odp|eml|msg|png|jpe?g|webp|heic|zip|rar|7z)$/', $f)) {
    http_response_code(404);
    exit;
}

$path = __DIR__ . '/' . $f;
if (!is_file($path)) {
    http_response_code(404);
    exit;
}

// Оригинальное имя не храним (клиентские имена ненадёжны) — отдаём файл
// под сохранённым hex-именем; расширение при этом сохраняется
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($path) . '"');
header('Content-Length: ' . filesize($path));
header('X-Content-Type-Options: nosniff');
readfile($path);
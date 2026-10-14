<?php
// send.php — MAX-уведомление о заявке с сайта «Мир ИИ для бизнеса».
// Токен бота хранится в max-config.php (на сервере, наружу не отдаётся).
// Браузер посетителя дёргает этот скрипт, а сервер Beget шлёт сообщение
// в MAX Bot API (platform-api2.max.ru).
//
// Синтаксис намеренно консервативный (PHP 7+): без стрелочных функций,
// ?? и strict_types — чтобы не зависеть от настроек хостинга.

require __DIR__ . '/max-config.php';

header('Content-Type: application/json; charset=utf-8');

// ---------------------------------------
// Проверки запроса
// ---------------------------------------

// Только POST
if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 403 Forbidden');
    exit('{"ok":false}');
}

// Только со своего сайта
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
if ($origin !== '' && $origin !== 'https://' . $host) {
    header('HTTP/1.1 403 Forbidden');
    exit('{"ok":false}');
}

// Honeypot: боты заполняют скрытое поле "website" — человеку оно не видно
if (isset($_POST['website']) && $_POST['website'] !== '') {
    // Молча подтверждаем, но ничего не отправляем
    exit('{"ok":true}');
}

// Rate limit: не чаще одной заявки в 60 секунд с одного IP
$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
$marker = sys_get_temp_dir() . '/miraileads_' . md5($ip);
if (is_file($marker) && (time() - (int) filemtime($marker)) < 60) {
    header('HTTP/1.1 429 Too Many Requests');
    exit('{"ok":false,"error":"rate"}');
}
@touch($marker);

// Гигиена: каждый ~20-й запрос подчищает свои маркеры старше суток
// и вложения старше недели (ссылки из уведомлений к этому моменту прочитаны)
if (mt_rand(1, 20) === 1) {
    $olds = glob(sys_get_temp_dir() . '/miraileads_*');
    if (is_array($olds)) {
        foreach ($olds as $old) {
            if (is_file($old) && (time() - (int) filemtime($old)) > 86400) {
                @unlink($old);
            }
        }
    }
    $dirs = glob(__DIR__ . '/uploads/*', GLOB_ONLYDIR);
    if (is_array($dirs)) {
        foreach ($dirs as $old) {
            // Файлы живут 30 дней — скачанные ссылки из MAX остаются рабочими месяц
            if (!is_dir($old) || (time() - (int) filemtime($old)) <= 2592000) continue;
            $inner = glob($old . '/*');
            if (is_array($inner)) {
                foreach ($inner as $f) @unlink($f);
            }
            @rmdir($old);
        }
    }
}

// ---------------------------------------
// Вложения: Formspree на бесплатном тарифе файлы не принимает
// («File Uploads Not Permitted»), поэтому сохраняем их у себя и
// присылаем в MAX кликабельные ссылки. Папка заявки — неугадываемый
// UUID-путь, листинг отключён .htaccess'ом.
// ---------------------------------------

$links = array();
$fileParts = 0;

// Нормализация $_FILES: при загрузке ОДНОГО файла PHP отдаёт поля
// строками (name => "a.txt"), при нескольких — массивами. Приводим оба
// варианта к единому списку, дальше работаем только с ним.
$incoming = array();
if (isset($_FILES['files']) && is_array($_FILES['files'])) {
    $f = $_FILES['files'];
    if (isset($f['name']) && is_array($f['name'])) {
        for ($i = 0, $n = count($f['name']); $i < $n; $i++) {
            $incoming[] = array(
                'name'     => $f['name'][$i],
                'error'    => (int) $f['error'][$i],
                'size'     => (int) $f['size'][$i],
                'tmp_name' => $f['tmp_name'][$i],
            );
        }
    } elseif (isset($f['tmp_name']) && $f['tmp_name'] !== '') {
        $incoming[] = array(
            'name'     => $f['name'],
            'error'    => (int) $f['error'],
            'size'     => (int) $f['size'],
            'tmp_name' => $f['tmp_name'],
        );
    }
    $fileParts = count($incoming);
} else {
    error_log('send.php: файловые части не найдены в $_FILES — запрос пришёл без файлов');
}

if (!empty($incoming)) {
    // Белый список расширений: документы, таблицы, картинки, архивы.
    // Исполняемое (.php и т.п.) сюда не попадает — и не исполнится.
    $allowedExt = array('pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','rtf','odt','ods','odp','eml','msg','png','jpg','jpeg','webp','heic','zip','rar','7z');
    $maxBytes  = 10 * 1024 * 1024; // 10 МБ на файл — как и проверка в main.js
    $maxFiles  = 5;               // столько же, сколько допускает фронтенд
    $uploadBase = __DIR__ . '/uploads';
    $dir = '';

    foreach ($incoming as $file) {
        if (count($links) >= $maxFiles) break;
        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log("send.php: файл {$file['name']} отклонён — код ошибки PHP {$file['error']}");
            continue; // битый файл — пропускаем молча
        }
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($file['size'] <= 0 || $file['size'] > $maxBytes) {
            error_log("send.php: файл {$file['name']} отклонён по размеру ({$file['size']} байт)");
            continue;
        }
        if (!in_array($ext, $allowedExt, true)) {
            error_log("send.php: файл {$file['name']} отклонён по расширению (.{$ext})");
            continue;
        }
        if (!is_uploaded_file($file['tmp_name'])) continue;
        if ($dir === '') {
            $dir = $uploadBase . '/' . bin2hex(random_bytes(16));
            if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
                error_log('send.php: не удалось создать папку ' . $dir . ' — проверьте права на uploads/');
                $dir = '';
                break; // хранилище недоступно — заявка уйдёт без вложений, но уйдёт
            }
        }
        $stored = bin2hex(random_bytes(8)) . '.' . $ext;
        if (@move_uploaded_file($file['tmp_name'], $dir . '/' . $stored)) {
            // Через dl.php, а не прямой ссылкой: nginx отдаёт статику мимо
            // Apache, .htaccess не работает, а dl.php ставит заголовок
            // «attachment» — клик в мессенджере скачивает файл, а не
            // открывает его содержимое в окне браузера
            $links[] = SITE_URL . '/uploads/dl.php?f=' . rawurlencode(basename($dir) . '/' . $stored);
        } else {
            error_log("send.php: move_uploaded_file не смог сохранить {$file['name']} в {$dir}");
        }
    }
}

// ---------------------------------------
// Сборка текста заявки (MAX принимает только чистый текст)
// ---------------------------------------

// Страховка UTF-8: json_encode возвращает false на битых байтах —
// чистим вход, иначе тело запроса к MAX уйдёт пустым
function miraileads_utf8($s) {
    if (function_exists('mb_convert_encoding')) {
        return mb_convert_encoding($s, 'UTF-8', 'UTF-8');
    }
    return $s;
}

$name    = isset($_POST['name'])    ? miraileads_utf8(trim($_POST['name']))    : '';
$phone   = isset($_POST['phone'])   ? miraileads_utf8(trim($_POST['phone']))   : '';
$email   = isset($_POST['email'])   ? miraileads_utf8(trim($_POST['email']))   : '';
$company = isset($_POST['company']) ? miraileads_utf8(trim($_POST['company'])) : '';
$message = isset($_POST['message']) ? miraileads_utf8(trim($_POST['message'])) : '';

if ($name === '' || $phone === '') {
    header('HTTP/1.1 422 Unprocessable Entity');
    exit('{"ok":false}');
}

$lines = array(
    'Заявка с сайта «Мир ИИ для бизнеса»',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
);
if ($email !== '')   $lines[] = 'Email: ' . $email;
if ($company !== '') $lines[] = 'Компания: ' . $company;
if ($message !== '') $lines[] = 'Задача: ' . $message;
if (!empty($links)) {
    $lines[] = 'Вложения (' . count($links) . '):';
    foreach ($links as $link) $lines[] = '• ' . $link;
} else {
    $lines[] = 'Вложения: нет';
}
$lines[] = 'Время: ' . date('d.m.Y H:i');

// ---------------------------------------
// Журнал заявок: каждая заявка дописывается строкой в leads/leads.csv —
// долгосрочное хранилище независимо от MAX и Formspree. Папка закрыта
// из веба через .htaccess, забирать файл по FTP.
// ---------------------------------------

$leadsDir  = __DIR__ . '/leads';
$leadsFile = $leadsDir . '/leads.csv';
if (!is_dir($leadsDir)) {
    @mkdir($leadsDir, 0755, true);
}
$fh = @fopen($leadsFile, 'a');
if ($fh === false) {
    error_log('send.php: не удалось открыть leads/leads.csv для записи');
} else {
    $isNew = filesize($leadsFile) === 0;
    flock($fh, LOCK_EX);
    if ($isNew) {
        // BOM + шапка: чтобы Excel открывал кириллицу и колонки сразу
        fwrite($fh, "\xEF\xBB\xBF");
        fputcsv($fh, array('Дата', 'Имя', 'Телефон', 'Email', 'Компания', 'Задача', 'Вложения'), ';');
    }
    fputcsv($fh, array(
        date('d.m.Y H:i'),
        $name,
        $phone,
        $email,
        $company,
        $message,
        implode(' | ', $links),
    ), ';');
    flock($fh, LOCK_UN);
    fclose($fh);
}

$text = implode("\n", $lines);
// Лимит MAX — 4000 символов; mbstring на Beget есть, но на всякий случай фолбэк
if (function_exists('mb_substr')) {
    if (mb_strlen($text, 'UTF-8') > 3900) $text = mb_substr($text, 0, 3900, 'UTF-8') . '…';
} else {
    if (strlen($text) > 3900) $text = substr($text, 0, 3900) . '…';
}

// ---------------------------------------
// Отправка в MAX Bot API
// ---------------------------------------

$payload = json_encode(array('text' => $text));
if ($payload === false) {
    // Встретился битый UTF-8, который не вылечила страховка выше
    error_log('send.php: json_encode вернул false — невалидный UTF-8 во входных данных');
    header('HTTP/1.1 422 Unprocessable Entity');
    exit('{"ok":false}');
}

$ch = curl_init('https://platform-api2.max.ru/messages?chat_id=' . rawurlencode((string) MAX_CHAT_ID));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: ' . MAX_BOT_TOKEN,
    'Content-Type: application/json',
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
// Фолбэк TLS: если рядом лежит сертификат НУЦ Минцифры — доверяем через него
// (на Beget системный CA обычно уже содержит НУЦ, файл — страховка)
$caFile = __DIR__ . '/russian-trusted-root-ca.pem';
if (is_file($caFile)) {
    curl_setopt($ch, CURLOPT_CAINFO, $caFile);
}

$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

// В лог хостинга — чтобы при проблемах можно было найти причину
if ($httpCode !== 200 || $curlErr !== '') {
    error_log("send.php: MAX HTTP {$httpCode} curl: {$curlErr} body: {$response}");
    header('HTTP/1.1 502 Bad Gateway');
    exit('{"ok":false}');
}

// parts — сколько файловых частей PHP вообще увидел в запросе,
// files — сколько вложений реально сохранилось: видно прямо в ответе,
// не нужно гадать по тексту уведомления
echo '{"ok":true,"parts":' . $fileParts . ',"files":' . count($links) . '}';
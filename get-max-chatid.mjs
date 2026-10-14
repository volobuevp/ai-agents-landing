// Утилита: узнать chat_id личного диалога с ботом MAX.
// API не отдаёт список чатов — chat_id приходит только в событиях
// long polling (GET /updates), как и для каналов.
//
// 1. Запуск: node get-max-chatid.mjs <токен_бота>
//    (нужен сертификат НУЦ Минцифры — обёртка ниже подставляет его,
//     запускать из папки Project-site)
// 2. В MAX напиши боту /start — ниже появится событие с chat_id.
// 3. Впиши chat_id в max-config.php.

const token = process.argv[2];
if (!token) {
  console.error('Запуск: node get-max-chatid.mjs <токен_бота>');
  process.exit(1);
}

const API_BASE = 'https://platform-api2.max.ru';

console.log('Жду сообщения боту (long polling, до ~5 минут). Напиши ему /start в MAX.\n');

let marker = null;
for (let i = 0; i < 20; i++) {
  const url = `${API_BASE}/updates?timeout=30${marker !== null ? `&marker=${marker}` : ''}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Authorization': token },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    console.error(`Сетевой сбой (попытка ${i + 1}/20): ${e.message} — продолжаю`);
    await new Promise(r => setTimeout(r, 2000));
    continue;
  }
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ошибка /updates (проверь токен и сертификат Минцифры)`);
    process.exit(1);
  }
  const data = await res.json();
  for (const u of data.updates || []) {
    console.log(JSON.stringify(u, null, 2));
    // chat_id может лежать на разных уровнях события — ищем рекурсивно
    const found = JSON.stringify(u).match(/"chat_id"\s*:\s*(-?\d+)/);
    if (found) console.log(`\n>>> CHAT_ID = ${found[1]} — впиши в max-config.php (MAX_CHAT_ID)`);
  }
  marker = data.marker;
}
console.log('\nГотово. Если событий не было — напиши боту /start ещё раз и перезапусти.');
/**
 * Мир ИИ для бизнеса — Main JavaScript
 * High-Tech Monospace Theme
 */

// ========================================
// Configuration (update before deploy)
// ========================================
const CONFIG = {
  // Formspree endpoint — резервный канал (копия заявки на почту, без файлов)
  FORMSPREE_URL: 'https://formspree.io/f/xnpjzrby',

  // PHP-обработчик на хостинге: MAX-уведомление + сохранение вложений.
  // Токен бота и chat_id живут в max-config.php — в публичный JS не выносятся.
  HANDLER_URL: 'send.php',
};

// ========================================
// Typewriter Effect
// ========================================
function initTypewriter() {
  const element = document.getElementById('typewriter');
  if (!element) return;

  const text = 'Провожу аудит. Устраняю рутину. Оптимизирую процессы. Измеряю экономику.';
  const speed = 45; // ms per character
  let i = 0;

  element.classList.add('typing');

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Keep blinking cursor
    }
  }

  // Delay start until hero lines appear
  setTimeout(type, 1200);
}

// ========================================
// Scroll Reveal (IntersectionObserver)
// ========================================
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -30px 0px',
    }
  );

  reveals.forEach((el) => observer.observe(el));

  // Якорный переход может «перепрыгнуть» элемент между кадрами:
  // IntersectionObserver его не увидит, и карточка останется прозрачной.
  // Fallback: при прокрутке помечаем всё, что уже вошло в кадр или прошло выше.
  let ticking = false;
  function catchSkipped() {
    reveals.forEach((el) => {
      if (el.classList.contains('visible')) return;
      if (el.getBoundingClientRect().top < window.innerHeight - 30) {
        el.classList.add('visible');
        observer.unobserve(el);
      }
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(catchSkipped);
    }
  }, { passive: true });
}

// ========================================
// Phone Mask (+7 (XXX) XXX-XX-XX)
// ========================================
function initPhoneMask() {
  const phoneInput = document.getElementById('phone');
  if (!phoneInput) return;

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';

    if (digits.length === 0) return '';

    const country = digits.startsWith('7') ? '+7' : '+7';
    const rest = digits.startsWith('7') ? digits.slice(1) : digits;

    formatted = country;

    if (rest.length > 0) {
      formatted += ' (' + rest.slice(0, 3);
    }
    if (rest.length >= 3) {
      formatted += ')';
    }
    if (rest.length > 3) {
      formatted += ' ' + rest.slice(3, 6);
    }
    if (rest.length > 6) {
      formatted += '-' + rest.slice(6, 8);
    }
    if (rest.length > 8) {
      formatted += '-' + rest.slice(8, 10);
    }

    return formatted;
  };

  phoneInput.addEventListener('input', (e) => {
    const start = e.target.selectionStart;
    const prevLen = e.target.value.length;
    e.target.value = formatPhone(e.target.value);
    const newLen = e.target.value.length;
    // Keep cursor roughly in place
    e.target.selectionStart = e.target.selectionEnd = Math.max(start + (newLen - prevLen), 0);
  });

  phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value) {
      phoneInput.value = '+7 ';
    }
  });

  phoneInput.addEventListener('blur', () => {
    if (phoneInput.value === '+7 ' || phoneInput.value === '+7') {
      phoneInput.value = '';
    }
  });
}

// ========================================
// Navigation Active State
// ========================================
function initNavActive() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[data-nav]');
  if (!sections.length || !navLinks.length) return;

  // Позиционный scrollspy: активна последняя секция, чей верх прошёл
  // отметку в 40% высоты вьюпорта. IO здесь ненадёжен — секции высотой
  // 950–1070px с threshold 0.3 не дотягивались до порога в узкой полосе,
  // и активный пункт «залипал» на предыдущей секции.
  let ticking = false;

  function update() {
    ticking = false;
    const mark = window.innerHeight * 0.4;
    let current = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= mark) {
        current = section;
      }
    });

    // В самом низу страницы активируем последний пункт (контакты),
    // даже если секция короткая и её верх не дошёл до отметки.
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }

    const id = current.getAttribute('id');
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
}

// ========================================
// Mobile burger menu
// ========================================
function initNavBurger() {
  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');
  if (!burger || !links) return;

  const close = () => {
    links.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  };

  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });

  // Закрываем при переходе по пункту и по Escape
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

// ========================================
// File attachments (input + drag & drop)
// ========================================
function initFileDrop() {
  const drop = document.getElementById('fileDrop');
  const input = document.getElementById('files');
  const hint = document.getElementById('fileHint');

  if (!drop || !input || !hint) return;

  const MAX_FILES = 5;
  const hintDefault = '[ ПРИКРЕПИТЬ ФАЙЛ ]';

  const updateHint = () => {
    const files = Array.from(input.files);
    if (!files.length) {
      hint.textContent = hintDefault;
      return;
    }
    const names = files.map((f) => f.name).join(', ');
    hint.textContent = `[ ${files.length} ФАЙЛ(ОВ): ${names} ]`;
  };

  const setFiles = (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_FILES);
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    updateHint();
  };

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
  input.addEventListener('change', updateHint);

  ['dragenter', 'dragover'].forEach((evt) => {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.remove('dragover');
    });
  });
  drop.addEventListener('drop', (e) => setFiles(e.dataTransfer.files));
}

// ========================================
// Form Submission
// ========================================
function initForm() {
  const form = document.getElementById('form');
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');
  const fileInput = form ? form.querySelector('#files') : null;

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.querySelector('#name').value.trim();
    const phone = form.querySelector('#phone').value.trim();
    const email = form.querySelector('#email').value.trim();
    const company = form.querySelector('#company').value.trim();
    const message = form.querySelector('#message').value.trim();
    const files = fileInput ? Array.from(fileInput.files) : [];

    // Basic validation
    if (!name || !phone) {
      status.className = 'form-status error';
      status.textContent = '>> ЗАПОЛНИТЕ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ';
      return;
    }

    // Проверка вложений до отправки: файл больше лимита не пройдёт
    // ни через PHP на хостинге, ни через Formspree — отказываем сразу
    const MAX_FILE_MB = 10;
    const MAX_TOTAL_MB = 30;
    let totalBytes = 0;
    for (const f of files) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        status.className = 'form-status error';
        status.textContent = '>> ФАЙЛ «' + f.name + '» БОЛЬШЕ ' + MAX_FILE_MB + ' МБ';
        return;
      }
      totalBytes += f.size;
    }
    // Суммарный лимит: запрос, превышающий post_max_size в PHP,
    // хостинг молча теряет целиком — лучше отказать на клиенте
    if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
      status.className = 'form-status error';
      status.textContent = '>> ФАЙЛЫ БОЛЬШЕ ' + MAX_TOTAL_MB + ' МБ СУММАРНО — ОСТАВЬТЕ МЕНЬШЕ';
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = '[ ОТПРАВКА... ]';
    status.className = 'form-status';
    status.textContent = '';

    // 1. Основной канал: send.php на хостинге — MAX-уведомление
    //    + сохранение вложений у себя (Formspree на бесплатном тарифе
    //    файлы не принимает — «File Uploads Not Permitted»).
    //    Multipart: текстовые поля и файлы уходят одним запросом.
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('company', company);
    formData.append('message', message);
    // Honeypot: пустое у человека, заполненное у спам-бота
    formData.append('website', form.querySelector('#website')?.value || '');
    files.forEach((f) => formData.append('files', f, f.name));

    let maxSuccess = false;
    try {
      const response = await fetch(CONFIG.HANDLER_URL, {
        method: 'POST',
        body: formData,
      });
      maxSuccess = response.ok;
    } catch (err) {
      console.error('send.php error:', err);
    }

    // 2. Резервный канал: Formspree — копия заявки на почту, текст без файлов
    let formspreeSuccess = false;
    try {
      const backup = new FormData();
      backup.append('name', name);
      backup.append('phone', phone);
      backup.append('email', email);
      backup.append('company', company);
      backup.append('message', message);

      const response = await fetch(CONFIG.FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: backup,
      });
      formspreeSuccess = response.ok;
    } catch (err) {
      console.error('Formspree error:', err);
    }

    // Reset UI
    submitBtn.disabled = false;
    submitBtn.textContent = '[ ОТПРАВИТЬ ]';

    if (maxSuccess || formspreeSuccess) {
      status.className = 'form-status success';
      status.textContent = '>> ЗАЯВКА ПРИНЯТА. ОЖИДАЙТЕ СВЯЗИ.';
      form.reset();
      // reset() очищает список файлов, но не подпись у зоны вложения —
      // дёргаем change, чтобы она вернулась к «ПРИКРЕПИТЬ ФАЙЛ»
      if (fileInput) fileInput.dispatchEvent(new Event('change'));
    } else {
      status.className = 'form-status error';
      status.textContent = '>> ОШИБКА ПЕРЕДАЧИ ДАННЫХ. ПОПРОБУЙТЕ ПОЗЖЕ.';
    }
  });
}

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initTypewriter();
  initScrollReveal();
  initPhoneMask();
  initNavActive();
  initNavBurger();
  initFileDrop();
  initForm();
});

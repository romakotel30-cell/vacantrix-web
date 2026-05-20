// =====================================================================
// Оркестратор главной страницы
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Утилиты ─────────────────────────────────────────────────────────
  function _escHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function _initReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
  }
  window._initReveal = _initReveal;

  const _PLATFORM_URL = 'https://github.com/romakotel30-cell/vacantrix-platform/releases/latest/download/VacantrixLauncher.exe';

  // ── Navbar ────────────────────────────────────────────────────────────
  function _updateNavbar(user, isAdmin) {
    document.getElementById('btn-login') ?.classList.toggle('hidden', !!user);
    document.getElementById('btn-logout')?.classList.toggle('hidden', !user);
    document.getElementById('btn-admin') ?.classList.toggle('hidden', !isAdmin);
    const ui = document.getElementById('user-info');
    if (ui) { ui.textContent = user ? user.email : ''; ui.classList.toggle('hidden', !user); }
  }

  // ── Hero-кнопка скачивания ─────────────────────────────────────────
  function _updateHeroBtn(user) {
    const btn = document.getElementById('hero-platform-dl');
    if (!btn) return;
    const sub   = btn.querySelector('.dl-sub');
    const arrow = btn.querySelector('.dl-arrow');
    if (user) {
      btn.classList.remove('btn-download-lock');
      if (sub)   sub.textContent   = 'Бесплатно · Windows · Без установки';
      if (arrow) arrow.textContent = '↓';
      btn.onclick = () => {
        const t = document.getElementById('ig-title');
        if (t) t.textContent = 'Установка Vacantrix Platform';
        const modal = document.getElementById('install-guide');
        if (modal) {
          for (let i = 1; i <= 4; i++) {
            const s = document.getElementById(`igs-${i}`);
            if (s) s.className = 'ig-step';
          }
          const s1 = document.getElementById('igs-1');
          if (s1) s1.className = 'ig-step active';
          modal.classList.remove('hidden');
          setTimeout(() => {
            const el1 = document.getElementById('igs-1');
            const el2 = document.getElementById('igs-2');
            if (el1) el1.className = 'ig-step done';
            if (el2) el2.className = 'ig-step active';
          }, 2000);
        }
        window.location.href = _PLATFORM_URL;
      };
    } else {
      btn.classList.add('btn-download-lock');
      if (sub)   sub.textContent   = 'Войдите, чтобы скачать';
      if (arrow) arrow.textContent = '🔒';
      btn.onclick = () => document.getElementById('btn-login')?.click();
    }
  }

  // ── Настройки ────────────────────────────────────────────────────────
  function _renderSettings(user) {
    const container = document.getElementById('settings-content');
    if (!container) return;
    if (!user) {
      container.innerHTML = `
        <div class="settings-locked reveal">
          <div class="settings-lock-icon">🔒</div>
          <h3>Войдите в аккаунт</h3>
          <p>Для доступа к настройкам необходима авторизация.</p>
          <button class="btn-primary" style="margin-top:8px"
                  onclick="document.getElementById('btn-login').click()">Войти / Зарегистрироваться</button>
        </div>`;
    } else {
      const since = new Date(user.created_at).toLocaleDateString('ru-RU',
        { year: 'numeric', month: 'long', day: 'numeric' });
      container.innerHTML = `
        <div class="settings-grid">
          <div class="settings-card reveal">
            <div class="settings-card-header"><span class="settings-icon">👤</span><h3>Профиль</h3></div>
            <div class="settings-item">
              <span class="settings-label">Email</span>
              <span class="settings-value">${_escHtml(user.email)}</span>
            </div>
            <div class="settings-item">
              <span class="settings-label">Аккаунт создан</span>
              <span class="settings-value">${since}</span>
            </div>
          </div>
          <div class="settings-card reveal" style="transition-delay:.08s">
            <div class="settings-card-header"><span class="settings-icon">🔐</span><h3>Безопасность</h3></div>
            <div class="settings-row">
              <div class="settings-row-info">
                <span class="settings-label">Пароль</span>
                <div class="settings-sub">Изменить пароль от аккаунта</div>
              </div>
              <button class="btn-outline sm" id="btn-change-pwd">Изменить</button>
            </div>
          </div>
          <div class="settings-card danger-card reveal" style="transition-delay:.16s">
            <div class="settings-card-header"><span class="settings-icon">🚪</span><h3>Выход</h3></div>
            <div class="settings-row">
              <div class="settings-row-info">
                <span class="settings-label">Завершить сессию</span>
                <div class="settings-sub">Выйти из аккаунта на этом устройстве</div>
              </div>
              <button class="btn-danger sm" id="btn-settings-logout">Выйти</button>
            </div>
          </div>
        </div>`;
      document.getElementById('btn-change-pwd')?.addEventListener('click', () => {
        document.getElementById('pwd-error').textContent = '';
        document.getElementById('pwd-new').value = '';
        document.getElementById('pwd-confirm').value = '';
        document.getElementById('pwd-modal')?.classList.remove('hidden');
      });
      document.getElementById('btn-settings-logout')?.addEventListener('click', async () => {
        await Auth.signOut();
      });
    }
    _initReveal();
  }

  function _showInfo(msg) {
    const el = document.getElementById('global-info');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 8000);
  }

  function _mapError(msg) {
    if (!msg) return 'Неизвестная ошибка.';
    if (msg.includes('Invalid login'))       return 'Неверный email или пароль.';
    if (msg.includes('Email not confirmed')) return 'Подтвердите email — проверьте почту.';
    if (msg.includes('already registered'))  return 'Этот email уже зарегистрирован.';
    if (msg.includes('Token has expired'))   return 'Код устарел. Войдите снова, чтобы получить новый.';
    if (msg.includes('otp_disabled'))        return 'Ошибка конфигурации OTP. Попробуйте войти с галочкой «Запомнить».';
    return msg;
  }

  // ════════════════════════════════════════════════════════════════════
  // ШАГИ:
  //  1. Немедленно регистрируем ВСЕ обработчики кнопок (синхронно)
  //  2. Инициализируем данные в фоне (без блокировки UI)
  // ════════════════════════════════════════════════════════════════════

  // ── 1. Вкладки (регистрация немедленно) ─────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${target}`)?.classList.add('active');
      requestAnimationFrame(_initReveal);
    });
  });

  // ── 1. Модальное окно авторизации ────────────────────────────────────
  const modal    = document.getElementById('auth-modal');
  const otpModal = document.getElementById('otp-modal');
  const authErr  = document.getElementById('auth-error');
  const otpErr   = document.getElementById('otp-error');
  let _pendingEmail = '';

  document.getElementById('btn-login')?.addEventListener('click', () => {
    modal.classList.remove('hidden');
    if (authErr) authErr.textContent = '';
    document.getElementById('auth-form')?.reset();
  });
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await Auth.signOut();
  });
  document.getElementById('modal-close')?.addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('otp-close')?.addEventListener('click', () => otpModal.classList.add('hidden'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  otpModal?.addEventListener('click', e => { if (e.target === otpModal) otpModal.classList.add('hidden'); });

  // ── 1. Переключение вход / регистрация ───────────────────────────────
  document.getElementById('switch-mode')?.addEventListener('click', () => {
    const submitBtn = document.getElementById('auth-submit');
    const isLogin   = submitBtn.dataset.mode === 'login';
    submitBtn.dataset.mode = isLogin ? 'register' : 'login';
    document.getElementById('auth-title').textContent    = isLogin ? 'Регистрация' : 'Вход';
    submitBtn.textContent                                 = isLogin ? 'Зарегистрироваться' : 'Войти';
    document.getElementById('switch-mode').textContent   = isLogin ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться';
    document.getElementById('remember-row').style.display = isLogin ? 'none' : 'flex';
    if (authErr) authErr.textContent = '';
  });

  // ── 1. Отправка формы ────────────────────────────────────────────────
  document.getElementById('auth-submit')?.addEventListener('click', async () => {
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const remember = document.getElementById('auth-remember')?.checked ?? false;
    const mode     = document.getElementById('auth-submit').dataset.mode;
    if (authErr) authErr.textContent = '';
    if (!email || !password) { if (authErr) authErr.textContent = 'Введите email и пароль.'; return; }
    try {
      if (mode === 'register') {
        const { needsConfirmation } = await Auth.register(email, password);
        modal.classList.add('hidden');
        if (needsConfirmation) _showInfo('Письмо с подтверждением отправлено на ' + email + '.');
      } else {
        const { needsOtp } = await Auth.loginPassword(email, password, remember);
        if (needsOtp) {
          _pendingEmail = email;
          modal.classList.add('hidden');
          if (otpErr) otpErr.textContent = '';
          const hint = document.getElementById('otp-hint');
          if (hint) hint.textContent = `Код отправлен на ${email}`;
          document.getElementById('otp-input').value = '';
          otpModal.classList.remove('hidden');
        } else {
          modal.classList.add('hidden');
        }
      }
    } catch (e) {
      if (authErr) authErr.textContent = _mapError(e.message);
    }
  });

  // ── 1. OTP ───────────────────────────────────────────────────────────
  document.getElementById('otp-submit')?.addEventListener('click', async () => {
    const token = document.getElementById('otp-input').value.trim();
    if (otpErr) otpErr.textContent = '';
    if (!token) { if (otpErr) otpErr.textContent = 'Введите код.'; return; }
    try {
      await Auth.verifyOtp(_pendingEmail, token);
      otpModal.classList.add('hidden');
    } catch (e) {
      if (otpErr) otpErr.textContent = _mapError(e.message);
    }
  });

  // ── 1. Смена пароля ──────────────────────────────────────────────────
  const pwdModal = document.getElementById('pwd-modal');
  document.getElementById('pwd-close')?.addEventListener('click', () => pwdModal?.classList.add('hidden'));
  pwdModal?.addEventListener('click', e => { if (e.target === pwdModal) pwdModal.classList.add('hidden'); });
  document.getElementById('pwd-submit')?.addEventListener('click', async () => {
    const newPwd  = document.getElementById('pwd-new').value;
    const confirm = document.getElementById('pwd-confirm').value;
    const err     = document.getElementById('pwd-error');
    if (err) err.textContent = '';
    if (!newPwd || newPwd.length < 6) { if (err) err.textContent = 'Минимум 6 символов.'; return; }
    if (newPwd !== confirm) { if (err) err.textContent = 'Пароли не совпадают.'; return; }
    try {
      await Auth.updatePassword(newPwd);
      pwdModal?.classList.add('hidden');
      _showInfo('Пароль успешно изменён.');
    } catch (e) { if (err) err.textContent = e.message; }
  });

  // ── 1. Лайтбокс ──────────────────────────────────────────────────────
  document.getElementById('lb-close')?.addEventListener('click', Apps.lbClose);
  document.getElementById('lb-prev')?.addEventListener('click', Apps.lbPrev);
  document.getElementById('lb-next')?.addEventListener('click', Apps.lbNext);
  document.getElementById('lightbox')?.addEventListener('click', e => {
    if (e.target.id === 'lightbox') Apps.lbClose();
  });

  // ── Подписка на изменения авторизации ────────────────────────────────
  Auth.onChange((user, isAdmin) => {
    _updateNavbar(user, isAdmin);
    Apps.rerender();
    _renderSettings(user);
    _updateHeroBtn(user);
  });

  // ── Начальное состояние UI (до загрузки данных) ───────────────────────
  _updateNavbar(null, false);
  _renderSettings(null);
  _updateHeroBtn(null);

  // ── 2. Асинхронная загрузка данных в фоне (не блокирует UI) ──────────
  (async () => {
    // Auth с таймаутом 5 сек — если зависнет, продолжаем без него
    try {
      await Promise.race([
        Auth.init(),
        new Promise((_, r) => setTimeout(() => r(new Error('auth_timeout')), 5000)),
      ]);
    } catch (e) {
      if (e.message !== 'auth_timeout') console.warn('Auth.init error:', e.message);
    }

    // Обновляем UI после auth (может изменился статус)
    _updateNavbar(Auth.currentUser(), Auth.isAdmin());
    _renderSettings(Auth.currentUser());
    _updateHeroBtn(Auth.currentUser());

    // Площадки и приложения грузим параллельно
    await Promise.allSettled([
      Platforms.loadAndRender().catch(e => console.warn('Platforms error:', e)),
      Apps.loadAndRender().catch(e => console.warn('Apps error:', e)),
    ]);

    _initReveal();
  })();
});

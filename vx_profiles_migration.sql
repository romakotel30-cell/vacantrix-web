-- =====================================================================
-- vx_profiles — централизованный профиль пользователей Vacantrix
-- Запустить: https://supabase.com/dashboard/project/fgcffgfyehequucnxegb/sql/new
-- =====================================================================

-- ── Функция автообновления updated_at (если ещё нет) ─────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Таблица ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vx_profiles (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Идентификаторы из разных приложений
  hh_applicant_id     text        UNIQUE,   -- ID с hh.ru (из куков)
  avito_user_id       text        UNIQUE,   -- ID с avito.ru
  telegram_id         bigint      UNIQUE,   -- Telegram user ID
  web_user_id         uuid        UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Отображаемые имена
  display_name        text,                 -- единый ник (задаётся пользователем)
  hh_username         text,                 -- имя профиля с hh.ru (авто)
  avito_username      text,                 -- имя профиля с avito (авто)

  -- Подписка (заполняет ТОЛЬКО Telegram-бот через service_role)
  subscription_expire timestamptz,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── Индексы для быстрого поиска ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vxp_hh    ON vx_profiles (hh_applicant_id)  WHERE hh_applicant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vxp_avito ON vx_profiles (avito_user_id)    WHERE avito_user_id   IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vxp_tg    ON vx_profiles (telegram_id)      WHERE telegram_id     IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vxp_web   ON vx_profiles (web_user_id)      WHERE web_user_id     IS NOT NULL;

-- ── RLS (Row Level Security) ──────────────────────────────────────────
ALTER TABLE vx_profiles ENABLE ROW LEVEL SECURITY;

-- Все могут читать
CREATE POLICY "vxp_select_all"   ON vx_profiles FOR SELECT USING (true);
-- Десктоп-приложения создают профиль при первом запуске
CREATE POLICY "vxp_insert_anon"  ON vx_profiles FOR INSERT WITH CHECK (true);
-- Десктоп обновляет username/display_name при каждом запуске
CREATE POLICY "vxp_update_anon"  ON vx_profiles FOR UPDATE USING (true) WITH CHECK (true);

-- ── Триггер автообновления updated_at ────────────────────────────────
DROP TRIGGER IF EXISTS trg_vxp_updated ON vx_profiles;
CREATE TRIGGER trg_vxp_updated
  BEFORE UPDATE ON vx_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Миграция: переносим существующих HH-пользователей из таблицы users ─
INSERT INTO vx_profiles (hh_applicant_id, telegram_id, subscription_expire)
SELECT
  applicant_id,
  telegram_id,
  subscription_expire
FROM users
WHERE applicant_id IS NOT NULL
  AND applicant_id != ''
  AND applicant_id != 'unknown'
ON CONFLICT (hh_applicant_id) DO NOTHING;

-- Результат: сколько профилей перенесено из Telegram-бота
SELECT COUNT(*) AS migrated_profiles FROM vx_profiles;

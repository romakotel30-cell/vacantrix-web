-- =====================================================================
-- vx_profiles — централизованный профиль пользователей Vacantrix
-- Запустить в: https://supabase.com/dashboard/project/fgcffgfyehequucnxegb/sql
-- =====================================================================

-- ── Таблица ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vx_profiles (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Идентификаторы из разных приложений (у пользователя может быть несколько)
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

-- Все могут читать (никнеймы и статус подписки — не секретные данные)
CREATE POLICY "vxp_select_all" ON vx_profiles
  FOR SELECT USING (true);

-- Любой может создать профиль (десктоп-приложение при первом запуске)
CREATE POLICY "vxp_insert_anon" ON vx_profiles
  FOR INSERT WITH CHECK (true);

-- Любой может обновить username/display_name (десктоп обновляет при каждом запуске)
-- Поле subscription_expire не трогают десктопы — только Telegram-бот через service_role
CREATE POLICY "vxp_update_anon" ON vx_profiles
  FOR UPDATE USING (true) WITH CHECK (true);

-- ── Триггер автообновления updated_at ────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vxp_updated') THEN
    CREATE TRIGGER trg_vxp_updated
      BEFORE UPDATE ON vx_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── Миграция: переносим существующих HH-пользователей из таблицы users ─
-- Telegram-бот уже хранит telegram_id + applicant_id + subscription_expire
-- Это переносит их в единый профиль без потери данных подписки
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

-- Результат: сколько профилей перенесено
SELECT COUNT(*) AS migrated_profiles FROM vx_profiles;

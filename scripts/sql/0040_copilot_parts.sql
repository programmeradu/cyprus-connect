-- Verde answers are stored as message parts (text, tool cards, checks) so the
-- conversation reloads with its cards. Old rows keep plain content.
ALTER TABLE copilot_messages ADD COLUMN IF NOT EXISTS parts jsonb;

-- Remover a constraint existente
ALTER TABLE user_layout_preferences 
DROP CONSTRAINT IF EXISTS user_layout_preferences_layout_type_check;
-- Adicionar 'accountant' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';

-- Garantir que Fernando Lima tem o role accountant
-- User ID do Fernando Lima: 7646e8bb-4a74-488b-aa86-21ba9f48f32f (visto nos logs)
INSERT INTO public.user_roles (user_id, role)
VALUES ('7646e8bb-4a74-488b-aa86-21ba9f48f32f', 'accountant'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
-- Adiciona o role 'fulltherapist' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fulltherapist';
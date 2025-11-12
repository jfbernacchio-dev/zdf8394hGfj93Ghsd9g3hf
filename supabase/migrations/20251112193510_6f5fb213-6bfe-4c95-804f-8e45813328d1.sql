-- Tornar CPF nullable, pois nem todos os usuários precisam ter CPF (especialmente contadores)
ALTER TABLE public.profiles 
ALTER COLUMN cpf DROP NOT NULL;

-- Adicionar constraint para garantir que full_name não seja string vazia
ALTER TABLE public.profiles
ADD CONSTRAINT full_name_not_empty CHECK (length(trim(full_name)) > 0);
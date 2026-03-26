import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/*
============================================================
  SUPABASE SQL SCHEMA — Run this in your SQL Editor
============================================================

-- PROFILES (auto-created on signup)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage categories" ON public.categories FOR ALL TO authenticated USING (true);
INSERT INTO public.categories (name) VALUES
  ('Dry Food'), ('Wet Food'), ('Puppy Food'), ('Kitten Food'),
  ('Senior Food'), ('Treats'), ('Supplements')
ON CONFLICT (name) DO NOTHING;

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (true);
INSERT INTO public.suppliers (name, contact, email, phone, address, status) VALUES
  ('PetNation Corp', 'Maria Santos', 'maria@petnation.ph', '+63 917 123 4567', 'Makati City, Metro Manila', 'Active'),
  ('FurFoods Inc', 'Juan Dela Cruz', 'juan@furfoods.ph', '+63 918 234 5678', 'Quezon City, Metro Manila', 'Active'),
  ('Animal Pantry Co', 'Rosa Reyes', 'rosa@animalpantry.ph', '+63 919 345 6789', 'Pasig City, Metro Manila', 'Active'),
  ('Wholesome Paws Ltd', 'Carlos Mendoza', 'carlos@wholesomepaws.ph', '+63 920 456 7890', 'Taguig City, Metro Manila', 'Inactive')
ON CONFLICT DO NOTHING;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  image TEXT DEFAULT '🐾',
  supplier TEXT,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL TO authenticated USING (true);
INSERT INTO public.products (name, category, price, stock, min_stock, image, supplier, sku) VALUES
  ('Chippie Chicken Bites', 'Dry Food', 299.00, 45, 20, '🐔', 'PetNation Corp', 'CCB-001'),
  ('Tuna Delight Wet Pack', 'Wet Food', 89.00, 8, 15, '🐟', 'FurFoods Inc', 'TDW-002'),
  ('Puppy Growth Formula', 'Puppy Food', 450.00, 12, 20, '🐶', 'Animal Pantry Co', 'PGF-003'),
  ('Senior Vitality Mix', 'Senior Food', 380.00, 30, 15, '🦴', 'Wholesome Paws Ltd', 'SVM-004'),
  ('Salmon Ocean Bites', 'Dry Food', 320.00, 6, 20, '🐠', 'FurFoods Inc', 'SOB-005'),
  ('Veggie Crunch Treats', 'Treats', 150.00, 55, 10, '🥦', 'Animal Pantry Co', 'VCT-006'),
  ('Beef & Rice Blend', 'Dry Food', 410.00, 22, 20, '🥩', 'PetNation Corp', 'BRB-007'),
  ('Kitten Starter Pack', 'Kitten Food', 275.00, 4, 15, '🐱', 'Wholesome Paws Ltd', 'KSP-008')
ON CONFLICT DO NOTHING;

-- SALES
CREATE TABLE IF NOT EXISTS public.sales (
  id SERIAL PRIMARY KEY,
  product TEXT NOT NULL,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  customer TEXT DEFAULT 'Walk-in',
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage sales" ON public.sales FOR ALL TO authenticated USING (true);

-- PURCHASES
CREATE TABLE IF NOT EXISTS public.purchases (
  id SERIAL PRIMARY KEY,
  supplier TEXT NOT NULL,
  product TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view purchases" ON public.purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage purchases" ON public.purchases FOR ALL TO authenticated USING (true);

-- AUTH TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.seed_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type) VALUES
    (NEW.id, 'Welcome to Chippie Chomps! 🐾', 'Your account is ready. Start managing your pet food inventory.', 'success'),
    (NEW.id, 'Low Stock Alert', 'Some products may need restocking. Check your inventory.', 'warning'),
    (NEW.id, 'Getting Started', 'Add your suppliers and products to get started.', 'info');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.seed_user_notifications();
*/

// CREATE FUNCTION get_email_by_username(input_username text)
// RETURNS text
// SECURITY DEFINER
// AS $$
//   SELECT email FROM profiles WHERE username = input_username;
// $$ LANGUAGE sql;
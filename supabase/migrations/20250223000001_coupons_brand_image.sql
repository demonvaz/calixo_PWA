-- Añadir columna brand_image a coupons para mostrar imagen en la tienda
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS brand_image TEXT;

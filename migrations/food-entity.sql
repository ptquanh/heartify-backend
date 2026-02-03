-- Create GIN indices for JSONB columns in foods table

CREATE INDEX idx_foods_diet_labels ON foods USING gin (diet_labels);
CREATE INDEX idx_foods_health_labels ON foods USING gin (health_labels);
CREATE INDEX idx_foods_cautions ON foods USING gin (cautions);
CREATE INDEX idx_foods_cuisine_type ON foods USING gin (cuisine_type);
CREATE INDEX idx_foods_meal_type ON foods USING gin (meal_type);
CREATE INDEX idx_foods_dish_type ON foods USING gin (dish_type);
CREATE INDEX idx_foods_total_nutrients ON foods USING gin (total_nutrients);

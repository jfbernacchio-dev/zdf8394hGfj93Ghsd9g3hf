-- Adicionar nova constraint permitindo metrics-grid
ALTER TABLE user_layout_preferences 
ADD CONSTRAINT user_layout_preferences_layout_type_check 
CHECK (layout_type IN ('dashboard', 'dashboard-example-grid', 'metrics-grid', 'metrics-charts-selection'));
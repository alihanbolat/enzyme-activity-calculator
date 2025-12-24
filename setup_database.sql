-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create samples table
CREATE TABLE samples (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sample_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sample_name)
);

-- Create measurements table
CREATE TABLE measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE NOT NULL,
    slope DECIMAL NOT NULL,
    r_squared DECIMAL NOT NULL,
    linear_region_start DECIMAL NOT NULL,
    linear_region_end DECIMAL NOT NULL,
    linear_points INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    volume_sample DECIMAL NOT NULL,
    volume_assay DECIMAL NOT NULL,
    dilution_factor DECIMAL NOT NULL,
    extinction_coefficient DECIMAL NOT NULL,
    cuvette_diameter DECIMAL NOT NULL,
    enzyme_activity DECIMAL NOT NULL,
    csv_filename TEXT,
    notes TEXT,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for sample statistics
CREATE OR REPLACE VIEW sample_statistics AS
SELECT 
    s.id as sample_id,
    s.user_id,
    s.sample_name,
    COUNT(m.id) as measurement_count,
    AVG(m.enzyme_activity) as mean_activity,
    STDDEV(m.enzyme_activity) as std_dev_activity,
    MIN(m.enzyme_activity) as min_activity,
    MAX(m.enzyme_activity) as max_activity,
    s.created_at,
    MAX(m.measurement_date) as last_measurement_date
FROM samples s
LEFT JOIN measurements m ON s.id = m.sample_id
GROUP BY s.id, s.user_id, s.sample_name, s.created_at;

-- Enable Row Level Security
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Create policies for samples table
CREATE POLICY "Users can view their own samples"
    ON samples FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own samples"
    ON samples FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own samples"
    ON samples FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own samples"
    ON samples FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for measurements table
CREATE POLICY "Users can view their own measurements"
    ON measurements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own measurements"
    ON measurements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own measurements"
    ON measurements FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own measurements"
    ON measurements FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_samples_user_id ON samples(user_id);
CREATE INDEX idx_measurements_user_id ON measurements(user_id);
CREATE INDEX idx_measurements_sample_id ON measurements(sample_id);
CREATE INDEX idx_measurements_date ON measurements(measurement_date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for samples table
CREATE TRIGGER update_samples_updated_at
    BEFORE UPDATE ON samples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

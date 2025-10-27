-- Add service_status table to control if ordering is open or closed
CREATE TABLE IF NOT EXISTS service_status (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) UNIQUE NOT NULL,
    is_open BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default row for ordering service
INSERT INTO service_status (service_name, is_open)
VALUES ('ordering', true)
ON CONFLICT (service_name) DO NOTHING;

-- Add comment
COMMENT ON TABLE service_status IS 'Controls whether various services (like ordering) are open or closed';
COMMENT ON COLUMN service_status.service_name IS 'Name of the service (e.g., "ordering")';
COMMENT ON COLUMN service_status.is_open IS 'Whether the service is currently open (true) or closed (false)';

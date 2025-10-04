-- Add total_hours field to schedules table for tracking monthly open hours
ALTER TABLE schedules 
ADD COLUMN total_hours DECIMAL(5,2) DEFAULT 0;

-- Add comment to explain the field
COMMENT ON COLUMN schedules.total_hours IS 'Total open hours for this month, calculated from schedule_data';

-- Update existing schedules to have 0 hours (they will be recalculated when saved)
UPDATE schedules SET total_hours = 0 WHERE total_hours IS NULL;

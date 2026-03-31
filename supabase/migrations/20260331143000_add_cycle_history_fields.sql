alter table public.cycle_settings
add column if not exists historical_last_period_date date,
add column if not exists historical_cycle_length_days integer,
add column if not exists historical_period_length_days integer,
add column if not exists future_phase_start_date date;

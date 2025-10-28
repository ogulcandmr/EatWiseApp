-- Create meal_completions table
CREATE TABLE IF NOT EXISTS public.meal_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
    meal_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar')),
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_completions_user_id ON public.meal_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_completions_plan_id ON public.meal_completions(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_completions_completion_date ON public.meal_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_meal_completions_user_date ON public.meal_completions(user_id, completion_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.meal_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own meal completions" ON public.meal_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal completions" ON public.meal_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal completions" ON public.meal_completions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal completions" ON public.meal_completions
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meal_completions_updated_at 
    BEFORE UPDATE ON public.meal_completions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
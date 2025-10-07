import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://whjkvkzouhobxevbqvsj.supabase.co'  // Replace with your project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indoamt2a3pvdWhvYnhldmJxdnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTEyOTIsImV4cCI6MjA3NTQyNzI5Mn0.1n0xxieYZ8Ct8NITjZH1-unYKynA9R6luenU-Qn5I5U'  // Replace with your anon public key

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to get a unique user ID for this browser
export const getUserId = () => {
  let userId = localStorage.getItem('victory_planner_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('victory_planner_user_id', userId);
  }
  return userId;
};
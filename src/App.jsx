import React, { useState, useEffect } from 'react';
import { Target, CheckSquare, BookOpen, TrendingUp, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { initGoogleCalendar, signIn, signOut, isSignedIn, getEvents, createEvent, deleteEvent as deleteGoogleEvent } from './googleCalendar';

export default function VictoryPlanner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  
  // Load data from localStorage on initial mount
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('victoryPlanner_goals');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'EXERCISE 3X PER WEEK', category: 'Health', target: 3, current: 0 }
    ];
  });
  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('victoryPlanner_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'REVIEW WEEKLY GOALS', completed: false, priority: 'high', date: new Date().toISOString().split('T')[0] }
    ];
  });
  
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('victoryPlanner_habits');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'DRINK 8 GLASSES OF WATER', streak: 5, completedToday: false }
    ];
  });
  
  const [journalEntries, setJournalEntries] = useState(() => {
    const saved = localStorage.getItem('victoryPlanner_journal');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('victoryPlanner_events');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('victoryPlanner_notes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  
  const [newGoal, setNewGoal] = useState({ title: '', category: '', customCategory: '', target: 10, current: 0 });
  const [newTask, setNewTask] = useState({ text: '', priority: 'medium', date: new Date().toISOString().split('T')[0] });
  const [newHabit, setNewHabit] = useState({ name: '' });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' });
  const [journalText, setJournalText] = useState('');
  const [todayMood, setTodayMood] = useState('');
  const [syncToGoogle, setSyncToGoogle] = useState(true);

  const categoryOptions = ['Health & Fitness', 'Career', 'Finance', 'Personal Growth', 'Relationships', 'Education', 'Creativity', 'Travel', 'Other'];

  // Initialize Google Calendar API
  useEffect(() => {
    initGoogleCalendar()
      .then(() => {
        setIsGoogleInitialized(true);
        setIsGoogleSignedIn(isSignedIn());
      })
      .catch(error => {
        console.error('Failed to initialize Google Calendar:', error);
      });
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('victoryPlanner_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('victoryPlanner_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('victoryPlanner_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('victoryPlanner_journal', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('victoryPlanner_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('victoryPlanner_notes', JSON.stringify(notes));
  }, [notes]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      setIsGoogleSignedIn(true);
      await syncFromGoogleCalendar();
    } catch (error) {
      console.error('Sign in failed:', error);
      alert('Failed to sign in to Google Calendar');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut();
      setIsGoogleSignedIn(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const syncFromGoogleCalendar = async () => {
    try {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await getEvents(firstDay.toISOString(), lastDay.toISOString());
      const googleEvents = response.result.items || [];
      
      const importedEvents = googleEvents.map(event => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        date: event.start.dateTime ? event.start.dateTime.split('T')[0] : event.start.date,
        time: event.start.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : '',
        googleEventId: event.id,
        fromGoogle: true
      }));

      // Merge with existing events (avoid duplicates)
      setEvents(prevEvents => {
        const nonGoogleEvents = prevEvents.filter(e => !e.fromGoogle);
        return [...nonGoogleEvents, ...importedEvents];
      });

      alert(`Synced ${importedEvents.length} events from Google Calendar!`);
    } catch (error) {
      console.error('Failed to sync from Google Calendar:', error);
      alert('Failed to sync from Google Calendar');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const openDayModal = (dayNum) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
    setSelectedDay(selectedDate);
    setShowDayModal(true);
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dayStr = day.toISOString().split('T')[0];
    return events.filter(e => e.date === dayStr);
  };

  const addGoal = () => {
    if (newGoal.title) {
      const finalCategory = newGoal.category === 'Other' ? newGoal.customCategory : newGoal.category;
      setGoals([...goals, { ...newGoal, category: finalCategory, id: Date.now(), current: 0 }]);
      setNewGoal({ title: '', category: '', customCategory: '', target: 10, current: 0 });
      setShowGoalModal(false);
      setShowCategoryDropdown(false);
    }
  };

  const addTask = () => {
    if (newTask.text) {
      setTasks([...tasks, { ...newTask, id: Date.now(), completed: false }]);
      setNewTask({ text: '', priority: 'medium', date: new Date().toISOString().split('T')[0] });
      setShowTaskModal(false);
    }
  };

  const addHabit = () => {
    if (newHabit.name) {
      setHabits([...habits, { ...newHabit, id: Date.now(), streak: 0, completedToday: false }]);
      setNewHabit({ name: '' });
      setShowHabitModal(false);
    }
  };

  const addEvent = async () => {
    if (newEvent.title && newEvent.date) {
      const event = { ...newEvent, id: Date.now() };
      
      // Add to local state
      setEvents([...events, event]);
      
      // Sync to Google Calendar if signed in and sync is enabled
      if (isGoogleSignedIn && syncToGoogle) {
        try {
          await createEvent(event);
          alert('Event added to Google Calendar!');
        } catch (error) {
          console.error('Failed to add event to Google Calendar:', error);
          alert('Event saved locally but failed to sync to Google Calendar');
        }
      }
      
      setNewEvent({ title: '', date: '', time: '' });
      setShowEventModal(false);
    }
  };

  const deleteEventLocal = async (eventId, googleEventId) => {
    // Delete from local state
    setEvents(events.filter(e => e.id !== eventId));
    
    // Delete from Google Calendar if it's synced
    if (isGoogleSignedIn && googleEventId) {
      try {
        await deleteGoogleEvent(googleEventId);
      } catch (error) {
        console.error('Failed to delete from Google Calendar:', error);
      }
    }
  };

  const createNewNote = () => {
    const newNote = { id: Date.now(), title: 'New Note', content: '', date: new Date().toISOString() };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setNoteContent('');
  };

  const saveNote = () => {
    if (selectedNote) {
      const lines = noteContent.split('\n');
      const firstLine = lines[0].trim() || 'New Note';
      setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title: firstLine, content: noteContent, date: new Date().toISOString() } : n));
      setSelectedNote(null);
      setNoteContent('');
    }
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote(null);
      setNoteContent('');
    }
  };

  const openNote = (note) => {
    setSelectedNote(note);
    setNoteContent(note.content);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleHabit = (id) => {
    setHabits(habits.map(h => 
      h.id === id ? { 
        ...h, 
        completedToday: !h.completedToday,
        streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1)
      } : h
    ));
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const updateGoalProgress = (id, change) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const newCurrent = Math.max(0, Math.min(g.target, g.current + change));
        return { ...g, current: newCurrent };
      }
      return g;
    }));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const saveJournalEntry = () => {
    if (journalText.trim()) {
      setJournalEntries([...journalEntries, { 
        id: Date.now(), 
        text: journalText, 
        date: new Date().toISOString() 
      }]);
      setJournalText('');
    }
  };

  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;

  const getPriorityColor = (priority) => {
    if (priority === 'high') return '#FF6B6B';
    if (priority === 'medium') return '#DFFF00';
    return '#00D100';
  };

  const getPriorityStyle = (priority) => {
    return {
      backgroundColor: getPriorityColor(priority),
      color: '#6B7280',
      padding: '4px 12px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    };
  };

  return (
    <div className="min-h-screen text-white" style={{
      background: 'linear-gradient(180deg, #4a90e2 0%, #87ceeb 50%, #b0d4f1 100%)',
      fontFamily: 'Futura, "Trebuchet MS", Arial, sans-serif'
    }}>
      <div className="bg-black/30 backdrop-blur-sm border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-center" style={{ 
              background: 'linear-gradient(to right, #FF6200, #FF8C00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em'
            }}>
              THE VICTORY PLANNER
            </h1>
            <p className="text-center text-orange-300 text-sm md:text-base" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{formatDate(currentDate)}</p>
            {isGoogleInitialized && (
              <div className="flex justify-center gap-2">
                {isGoogleSignedIn ? (
                  <>
                    <button onClick={syncFromGoogleCalendar} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-all text-white text-xs md:text-sm font-bold" style={{ backgroundColor: '#10B981' }}>
                      <CalendarIcon size={14} />
                      SYNC
                    </button>
                    <button onClick={handleGoogleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-all text-white text-xs md:text-sm font-bold" style={{ backgroundColor: '#6B7280' }}>
                      SIGN OUT
                    </button>
                  </>
                ) : (
                  <button onClick={handleGoogleSignIn} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-90 transition-all text-white text-xs md:text-sm font-bold" style={{ backgroundColor: '#FF6200' }}>
                    <CalendarIcon size={14} />
                    CONNECT GOOGLE
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-black/20 backdrop-blur-sm border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-2 py-4 flex-wrap">
            {[
              { id: 'dashboard', icon: TrendingUp, label: 'DASHBOARD' },
              { id: 'calendar', icon: Target, label: 'CALENDAR' },
              { id: 'tasks', icon: CheckSquare, label: 'TASKS' },
              { id: 'goals', icon: Target, label: 'GOALS' },
              { id: 'habits', icon: CheckSquare, label: 'HABITS' },
              { id: 'notes', icon: BookOpen, label: 'NOTES' },
              { id: 'journal', icon: BookOpen, label: 'JOURNAL' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold ${
                  activeTab === tab.id ? 'text-white' : 'text-orange-300 hover:bg-white/20'
                }`}
                style={activeTab === tab.id ? { backgroundColor: '#FF6200', letterSpacing: '0.05em' } : { letterSpacing: '0.05em' }}
              >
                <tab.icon size={18} />
                <span className="font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 rounded-lg hover:opacity-90 transition-all text-white text-sm font-bold" style={{ backgroundColor: '#FF6200' }}>
                  ← PREV
                </button>
                <h3 className="text-2xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 rounded-lg hover:opacity-90 transition-all text-white text-sm font-bold" style={{ backgroundColor: '#FF6200' }}>
                  NEXT →
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="text-center text-sm font-bold text-orange-300" style={{ letterSpacing: '0.05em' }}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                  const dayNum = i - firstDay + 1;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const isToday = isCurrentMonth && dayNum === currentDate.getDate();
                  const dayEvents = events.filter(e => {
                    const eventDate = new Date(e.date);
                    return eventDate.getDate() === dayNum && eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
                  });
                  return (
                    <div 
                      key={i} 
                      onClick={() => isCurrentMonth && openDayModal(dayNum)}
                      className={`aspect-square p-2 rounded-lg ${!isCurrentMonth ? 'opacity-30' : ''} ${isToday ? 'ring-2 ring-orange-500' : ''} bg-black/20 hover:bg-black/30 transition-all cursor-pointer`}
                    >
                      {isCurrentMonth && (
                        <>
                          <div className={`text-sm font-bold mb-1 ${isToday ? 'text-orange-500' : ''}`}>{dayNum}</div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div key={event.id} className="text-xs px-1 py-0.5 rounded truncate" style={{ backgroundColor: event.fromGoogle ? '#10B981' : '#FF6200' }}>{event.title}</div>
                            ))}
                            {dayEvents.length > 2 && <div className="text-xs text-orange-300">+{dayEvents.length - 2} more</div>}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>UPCOMING EVENTS</h4>
                {events.slice(0, 3).map(event => (
                  <div key={event.id} className="bg-black/30 rounded-lg p-3 text-sm">
                    <h5 className="font-bold">{event.title} {event.fromGoogle && <span className="text-xs text-green-400">(Google)</span>}</h5>
                    <p className="text-orange-300 text-xs">{event.date} {event.time && `at ${event.time}`}</p>
                  </div>
                ))}
                {events.length === 0 && <p className="text-gray-400 text-center py-2 text-sm">No events scheduled</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Target size={24} style={{ color: '#FF6200' }} />ACTIVE GOALS
                </h3>
                <div className="text-4xl font-bold" style={{ color: '#FF6200' }}>{goals.length}</div>
                <div className="mt-2 text-sm bg-white/20 px-3 py-2 rounded-lg font-bold text-white" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {goals.filter(g => g.current >= g.target).length} COMPLETED
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <CheckSquare size={24} style={{ color: '#FF6200' }} />TASKS COMPLETE
                </h3>
                <div className="text-4xl font-bold" style={{ color: '#FF6200' }}>{completedToday}/{totalToday}</div>
                <div className="mt-2 text-sm bg-white/20 px-3 py-2 rounded-lg font-bold text-white" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {totalToday > 0 ? `${Math.round((completedToday/totalToday)*100)}% COMPLETE` : 'NO TASKS YET'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <TrendingUp size={24} style={{ color: '#FF6200' }} />HABIT STREAKS
                </h3>
                <div className="text-4xl font-bold" style={{ color: '#FF6200' }}>{habits.reduce((max, h) => Math.max(max, h.streak), 0)}</div>
                <div className="mt-2 text-sm bg-white/20 px-3 py-2 rounded-lg font-bold text-white" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>DAYS LONGEST STREAK</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                <h3 className="text-xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>TODAY'S TASKS</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {todayTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 bg-black/20 p-3 rounded-lg">
                      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="w-5 h-5 rounded" style={{ accentColor: '#FF6200' }} />
                      <div className="flex-1 flex items-center gap-2">
                        <span className={task.completed ? 'line-through text-gray-400' : ''} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{task.text}</span>
                        <span style={getPriorityStyle(task.priority)} className="text-xs">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                  {todayTasks.length === 0 && <p className="text-gray-400 text-center py-4">No tasks for today</p>}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                <h3 className="text-xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>TODAY'S HABITS</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {habits.map(habit => (
                    <div key={habit.id} className="flex items-center gap-2 bg-black/20 p-3 rounded-lg">
                      <input type="checkbox" checked={habit.completedToday} onChange={() => toggleHabit(habit.id)} className="w-5 h-5 rounded" style={{ accentColor: '#FF6200' }} />
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{habit.name}</span>
                      <span className="ml-auto" style={{ color: '#FF6200' }}>🔥 {habit.streak}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
              <h3 className="text-xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>HOW ARE YOU FEELING TODAY?</h3>
              <div className="flex gap-4 justify-center flex-wrap">
                {['😊', '😐', '😔', '😤', '🤗'].map(mood => (
                  <button key={mood} onClick={() => setTodayMood(mood)} className={`text-5xl p-4 rounded-full transition-all ${todayMood === mood ? 'scale-110' : 'bg-white/10 hover:bg-white/20'}`} style={todayMood === mood ? { backgroundColor: '#FF6200' } : {}}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>TASKS</h2>
              <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>
                <Plus size={20} />Add Task
              </button>
            </div>
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-orange-500/20 flex items-center gap-4">
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="w-6 h-6 rounded" style={{ accentColor: '#FF6200' }} />
                  <div className="flex-1">
                    <p className={`text-lg mb-2 ${task.completed ? 'line-through text-gray-400' : ''}`} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{task.text}</p>
                    <div className="flex gap-2">
                      <span style={getPriorityStyle(task.priority)}>
                        {task.priority}
                      </span>
                      <span style={{ 
                        backgroundColor: '#6B7280',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        DUE: {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>GOALS</h2>
              <button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>
                <Plus size={20} />Add Goal
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map(goal => {
                const progress = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                return (
                  <div key={goal.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{goal.title}</h3>
                        <span className="text-sm bg-orange-500/30 px-3 py-1 rounded-lg font-bold text-white mt-2 inline-block" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{goal.category}</span>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="bg-black/30 rounded-full h-3 overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#FF6200' }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 bg-black/30 rounded-lg p-4">
                      <button 
                        onClick={() => updateGoalProgress(goal.id, -1)}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold hover:opacity-80 transition-all text-white"
                        style={{ backgroundColor: '#FF6200' }}
                      >
                        −
                      </button>
                      <div className="text-center">
                        <div className="text-4xl font-bold" style={{ color: '#FF6200' }}>{goal.current}</div>
                        <div className="text-sm text-gray-300">of {goal.target}</div>
                      </div>
                      <button 
                        onClick={() => updateGoalProgress(goal.id, 1)}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold hover:opacity-80 transition-all text-white"
                        style={{ backgroundColor: '#FF6200' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'habits' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>HABIT TRACKER</h2>
              <button onClick={() => setShowHabitModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>
                <Plus size={20} />Add Habit
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {habits.map(habit => (
                <div key={habit.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <input type="checkbox" checked={habit.completedToday} onChange={() => toggleHabit(habit.id)} className="w-6 h-6 rounded" style={{ accentColor: '#FF6200' }} />
                      <div>
                        <h3 className="text-lg font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{habit.name}</h3>
                        <span style={{ 
                          backgroundColor: '#6B7280',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'inline-block',
                          marginTop: '4px'
                        }}>
                          🔥 {habit.streak} DAY STREAK
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteHabit(habit.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div>
            <h2 className="text-3xl font-bold mb-6" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>JOURNAL</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20 mb-6">
              <h3 className="text-xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>TODAYS ENTRY</h3>
              <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="What's on your mind?" className="w-full h-40 bg-black/30 rounded-lg p-4 text-white placeholder-gray-400 resize-none border border-orange-500/20" />
              <button onClick={saveJournalEntry} className="mt-4 px-6 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>Save Entry</button>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAST ENTRIES</h3>
              {journalEntries.slice().reverse().map(entry => (
                <div key={entry.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20 cursor-pointer hover:bg-white/20 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => {
                      setJournalText(entry.text);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                      <p className="text-sm font-bold mb-2" style={{ color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                      </p>
                      <p className="text-white line-clamp-3">{entry.text}</p>
                      <p className="text-white font-bold text-sm mt-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLICK TO EDIT</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this journal entry?')) {
                          setJournalEntries(journalEntries.filter(j => j.id !== entry.id));
                        }
                      }} 
                      className="text-red-400 hover:text-red-300 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {journalEntries.length === 0 && <p className="text-gray-400 text-center py-8">No journal entries yet. Start writing!</p>}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>CALENDAR</h2>
              <button onClick={() => setShowEventModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>
                <Plus size={20} />Add Event
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => changeMonth(-1)} className="px-3 py-2 rounded-lg hover:opacity-90 transition-all text-white text-sm font-bold" style={{ backgroundColor: '#FF6200' }}>
                    ← PREV
                  </button>
                  <h3 className="text-3xl font-bold">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => changeMonth(1)} className="px-3 py-2 rounded-lg hover:opacity-90 transition-all text-white text-sm font-bold" style={{ backgroundColor: '#FF6200' }}>
                    NEXT →
                  </button>
                </div>
                <button onClick={() => setShowEventModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>
                  <Plus size={20} />Add Event
                </button>
              </div>
              <div className="text-center mb-6">
              </div>
              <div className="grid grid-cols-7 gap-3 mb-3">
                {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(day => (
                  <div key={day} className="text-center text-sm font-bold text-orange-300" style={{ letterSpacing: '0.05em' }}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                  const dayNum = i - firstDay + 1;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const isToday = isCurrentMonth && dayNum === currentDate.getDate();
                  const dayEvents = events.filter(e => {
                    const eventDate = new Date(e.date);
                    return eventDate.getDate() === dayNum && eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
                  });
                  return (
                    <div 
                      key={i} 
                      onClick={() => isCurrentMonth && openDayModal(dayNum)}
                      className={`aspect-square p-3 rounded-lg ${!isCurrentMonth ? 'opacity-30' : ''} ${isToday ? 'ring-2 ring-orange-500' : ''} bg-black/20 hover:bg-black/30 transition-all cursor-pointer`}
                    >
                      {isCurrentMonth && (
                        <>
                          <div className={`text-lg font-bold mb-2 ${isToday ? 'text-orange-500' : ''}`}>{dayNum}</div>
                          <div className="space-y-1">
                            {dayEvents.map(event => (
                              <div key={event.id} className="text-xs px-2 py-1 rounded truncate flex justify-between items-center" style={{ backgroundColor: event.fromGoogle ? '#10B981' : '#FF6200' }}>
                                <span>
                                  {event.time && <span className="font-bold">{event.time} </span>}
                                  {event.title}
                                </span>
                                <button onClick={() => deleteEventLocal(event.id, event.googleEventId)} className="text-red-200 hover:text-white ml-1">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-300px)]">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-orange-500/20 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-orange-500/20 flex justify-between items-center">
                <h2 className="text-xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>NOTES</h2>
                <button onClick={createNewNote} className="p-2 rounded-lg hover:opacity-90 transition-all text-white" style={{ backgroundColor: '#FF6200' }}>
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notes.map(note => (
                  <div key={note.id} onClick={() => openNote(note)} className={`p-4 border-b border-orange-500/20 cursor-pointer hover:bg-white/10 transition-all ${selectedNote && selectedNote.id === note.id ? 'bg-white/20' : ''}`}>
                    <h3 className="font-bold text-white truncate">{note.title}</h3>
                    <p className="text-sm text-gray-300 truncate">{new Date(note.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-400 truncate mt-1">{note.content.substring(0, 50)}...</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl border border-orange-500/20 overflow-hidden flex flex-col">
              {selectedNote ? (
                <>
                  <div className="p-4 border-b border-orange-500/20 flex justify-between items-center">
                    <button onClick={saveNote} className="px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>
                      Done
                    </button>
                    <button onClick={() => deleteNote(selectedNote.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Start typing..." className="w-full h-full bg-transparent text-white placeholder-gray-400 resize-none border-none outline-none text-lg" style={{ fontFamily: 'Futura, "Trebuchet MS", Arial, sans-serif' }} />
                  </div>
                  <div className="p-4 border-t border-orange-500/20 text-sm text-gray-400">
                    {new Date(selectedNote.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <BookOpen size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a note or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md w-full border border-orange-500/20">
            <h3 className="text-2xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>ADD NEW TASK</h3>
            <input type="text" placeholder="Task description" value={newTask.text} onChange={(e) => setNewTask({ ...newTask, text: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 mb-3 border border-orange-500/20" />
            <div className="mb-3">
              <label className="block text-sm font-bold mb-2 text-orange-300">PRIORITY</label>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white border border-orange-500/20">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-bold mb-2 text-orange-300">DATE</label>
              <input type="date" value={newTask.date} onChange={(e) => setNewTask({ ...newTask, date: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white border border-orange-500/20" />
            </div>
            <div className="flex gap-3">
              <button onClick={addTask} className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>Add Task</button>
              <button onClick={() => { setShowTaskModal(false); setNewTask({ text: '', priority: 'medium', date: new Date().toISOString().split('T')[0] }); }} className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md w-full border border-orange-500/20">
            <h3 className="text-2xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>ADD NEW GOAL</h3>
            <input type="text" placeholder="Goal title (e.g., Exercise 3x per week)" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 mb-3 border border-orange-500/20" />
            <div className="mb-3">
              <label className="block text-sm font-bold mb-2 text-orange-300">TARGET NUMBER</label>
              <input type="number" min="1" placeholder="e.g., 3 for 3 times per week" value={newGoal.target} onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 1 })} className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 border border-orange-500/20" />
            </div>
            <div className="relative mb-3">
              <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="w-full bg-black/30 rounded-lg p-3 text-left border border-orange-500/20 flex justify-between items-center">
                <span className={newGoal.category ? 'text-white' : 'text-gray-400'}>{newGoal.category || 'Select category'}</span>
                <span className="text-orange-300">▼</span>
              </button>
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 rounded-lg border border-orange-500/20 max-h-60 overflow-y-auto z-10">
                  {categoryOptions.map(cat => (
                    <button key={cat} onClick={() => { setNewGoal({ ...newGoal, category: cat }); setShowCategoryDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-orange-500/20 transition-colors text-white">{cat}</button>
                  ))}
                </div>
              )}
            </div>
            {newGoal.category === 'Other' && (
              <input type="text" placeholder="Enter custom category" value={newGoal.customCategory} onChange={(e) => setNewGoal({ ...newGoal, customCategory: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 mb-3 border border-orange-500/20" />
            )}
            <div className="flex gap-3">
              <button onClick={addGoal} className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>Add Goal</button>
              <button onClick={() => { setShowGoalModal(false); setShowCategoryDropdown(false); setNewGoal({ title: '', category: '', customCategory: '', target: 10, current: 0 }); }} className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showHabitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md w-full border border-orange-500/20">
            <h3 className="text-2xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>ADD NEW HABIT</h3>
            <input type="text" placeholder="Habit name" value={newHabit.name} onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 mb-3 border border-orange-500/20" />
            <div className="flex gap-3">
              <button onClick={addHabit} className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>Add Habit</button>
              <button onClick={() => { setShowHabitModal(false); setNewHabit({ name: '' }); }} className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md w-full border border-orange-500/20">
            <h3 className="text-2xl font-bold mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>ADD NEW EVENT</h3>
            <input type="text" placeholder="Event title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white placeholder-gray-400 mb-3 border border-orange-500/20" />
            <div className="mb-3">
              <label className="block text-sm font-bold mb-2 text-orange-300">DATE</label>
              <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white border border-orange-500/20" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-bold mb-2 text-orange-300">TIME (OPTIONAL)</label>
              <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full bg-black/30 rounded-lg p-3 text-white border border-orange-500/20" />
            </div>
            {isGoogleSignedIn && (
              <div className="mb-3 flex items-center gap-2">
                <input type="checkbox" id="syncToGoogle" checked={syncToGoogle} onChange={(e) => setSyncToGoogle(e.target.checked)} className="w-5 h-5 rounded" style={{ accentColor: '#FF6200' }} />
                <label htmlFor="syncToGoogle" className="text-sm text-orange-300 font-bold">SYNC TO GOOGLE CALENDAR</label>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={addEvent} className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-all text-white font-bold" style={{ backgroundColor: '#FF6200' }}>Add Event</button>
              <button onClick={() => { setShowEventModal(false); setNewEvent({ title: '', date: '', time: '' }); }} className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-2xl w-full border border-orange-500/20 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button onClick={() => setShowDayModal(false)} className="text-white hover:text-orange-300 text-2xl">×</button>
            </div>
            
            <button 
              onClick={() => {
                setNewEvent({ ...newEvent, date: selectedDay.toISOString().split('T')[0] });
                setShowDayModal(false);
                setShowEventModal(true);
              }} 
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:opacity-90 transition-all text-white font-bold" 
              style={{ backgroundColor: '#FF6200' }}
            >
              <Plus size={20} />ADD EVENT FOR THIS DAY
            </button>

            <div className="space-y-3">
              <h4 className="text-lg font-bold text-orange-300" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                EVENTS ({getEventsForDay(selectedDay).length})
              </h4>
              {getEventsForDay(selectedDay).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No events for this day</p>
              ) : (
                getEventsForDay(selectedDay).map(event => (
                  <div key={event.id} className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="text-lg font-bold text-white mb-1">{event.title}</h5>
                        {event.time && <p className="text-sm text-orange-300 mb-1">🕐 {event.time}</p>}
                        {event.fromGoogle && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#10B981' }}>
                            FROM GOOGLE CALENDAR
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteEventLocal(event.id, event.googleEventId)} 
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
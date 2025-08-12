import { createClient } from '@supabase/supabase-js';

// Create a mock client when Supabase credentials are not available
const supabaseUrl = 'https://zjmspwhsedkmnlbptpnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbXNwd2hzZWRrbW5sYnB0cG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNzk3ODEsImV4cCI6MjA2NzY1NTc4MX0.f4Aoj1yHDZ5BW8GRdolAiNGpHA3JNJbHXOX-D3kwo5U'

// Only import and create real client if we have valid credentials
let supabase: any = null;

try {
  if (supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Create a mock client for development
    supabase = {
      from: () => ({
        select: () => ({ 
          eq: () => ({ 
            single: () => Promise.resolve({ data: null, error: new Error('No database') }),
            maybeSingle: () => Promise.resolve({ data: null, error: new Error('No database') })
          }),
          or: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => ({ 
          select: () => ({ 
            single: () => Promise.resolve({ data: null, error: new Error('No database') }) 
          }) 
        }),
        update: () => ({ 
          eq: () => ({ 
            select: () => ({ 
              single: () => Promise.resolve({ data: null, error: new Error('No database') }) 
            }) 
          }) 
        }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('No database') }) }),
        upsert: () => ({ 
          select: () => ({ 
            single: () => Promise.resolve({ data: null, error: new Error('No database') }) 
          }) 
        })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: new Error('No storage') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
      }
    };
  }
} catch (error) {
  console.warn('Supabase not available, using local storage fallback');
  // Create a mock client
  supabase = {
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('No database') }),
          maybeSingle: () => Promise.resolve({ data: null, error: new Error('No database') })
        }),
        or: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({ 
        select: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('No database') }) 
        }) 
      }),
      update: () => ({ 
        eq: () => ({ 
          select: () => ({ 
            single: () => Promise.resolve({ data: null, error: new Error('No database') }) 
          }) 
        }) 
      }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('No database') }) }),
      upsert: () => ({ 
        select: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('No database') }) 
        }) 
      })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('No storage') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
}

export { supabase };

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          profile_picture: string | null
          access_code: string
          profile_title: string
          created_at: string
          stats: any
        }
        Insert: {
          id?: string
          email: string
          display_name: string
          profile_picture?: string | null
          access_code: string
          profile_title?: string
          created_at?: string
          stats?: any
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          profile_picture?: string | null
          access_code?: string
          profile_title?: string
          created_at?: string
          stats?: any
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          creator_id: string
          players: any
          settings: any
          status: 'waiting' | 'in_progress' | 'completed'
          current_scores: any
          hands: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          players: any
          settings: any
          status?: 'waiting' | 'in_progress' | 'completed'
          current_scores?: any
          hands?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          players?: any
          settings?: any
          status?: 'waiting' | 'in_progress' | 'completed'
          current_scores?: any
          hands?: any
          created_at?: string
          updated_at?: string
        }
      }
      match_history: {
        Row: {
          id: string
          game_id: string
          players: any
          settings: any
          final_scores: any
          winning_team: string
          hands_played: number
          duration: number
          penalties: any
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string
          players: any
          settings: any
          final_scores: any
          winning_team: string
          hands_played?: number
          duration?: number
          penalties?: any
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          players?: any
          settings?: any
          final_scores?: any
          winning_team?: string
          hands_played?: number
          duration?: number
          penalties?: any
          created_at?: string
        }
      }
    }
  }
}
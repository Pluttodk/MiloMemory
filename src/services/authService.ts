// filepath: c:\Code\dev\FindFriends\src\services\authService.ts
import { supabase } from '../config/supabase';

/**
 * Authentication Service for handling user authentication with Supabase
 */
export class AuthService {
  /**
   * Signs up a new user
   * @param email User's email
   * @param password User's password
   * @param displayName User's display name
   * @returns The user data or error
   */
  public static async signUp(email: string, password: string, displayName: string): Promise<any> {
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            display_name: displayName
          });

        if (profileError) throw profileError;
      }

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    }
  }

  /**
   * Signs in an existing user
   * @param email User's email
   * @param password User's password
   * @returns The user session or error
   */
  public static async signIn(email: string, password: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error in signIn:', error);
      throw error;
    }
  }

  /**
   * Signs out the current user
   */
  public static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  }

  /**
   * Gets the current user session
   * @returns The current session or null
   */
  public static async getCurrentSession(): Promise<any> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return data.session;
    } catch (error) {
      console.error('Error in getCurrentSession:', error);
      return null;
    }
  }

  /**
   * Gets the current user
   * @returns The current user or null
   */
  public static async getCurrentUser(): Promise<any> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  }

  /**
   * Gets a user's profile
   * @param userId User ID to get profile for
   * @returns The user profile or null
   */
  public static async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Updates a user's profile
   * @param userId User ID to update profile for
   * @param profile Profile data to update
   * @returns The updated profile or error
   */
  public static async updateUserProfile(userId: string, profile: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profile,
          updated_at: new Date()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }
}
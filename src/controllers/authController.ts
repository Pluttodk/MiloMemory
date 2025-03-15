// filepath: c:\Code\dev\FindFriends\src\controllers\authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

/**
 * Controller for handling authentication operations
 */
export class AuthController {
  /**
   * Handles user registration
   * @param req Express request object
   * @param res Express response object
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, displayName } = req.body;
      
      if (!email || !password || !displayName) {
        res.status(400).json({
          success: false,
          message: 'Email, password and display name are required'
        });
        return;
      }
      
      const userData = await AuthService.signUp(email, password, displayName);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: userData.user.id,
          email: userData.user.email
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error registering user',
        error: error
      });
    }
  }
  
  /**
   * Handles user login
   * @param req Express request object
   * @param res Express response object
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }
      
      const data = await AuthService.signIn(email, password);
      
      // Get user profile
      const profile = await AuthService.getUserProfile(data.user.id);
      
      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: profile?.display_name || ''
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error logging in',
        error: error
      });
    }
  }
  
  /**
   * Handles user logout
   * @param req Express request object
   * @param res Express response object
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      await AuthService.signOut();
      
      res.status(200).json({
        success: true,
        message: 'User logged out successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error logging out',
        error: error
      });
    }
  }
  
  /**
   * Gets the current user profile
   * @param req Express request object
   * @param res Express response object
   */
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }
      
      const profile = await AuthService.getUserProfile(user.id);
      
      res.status(200).json({
        success: true,
        profile: {
          id: user.id,
          email: user.email,
          displayName: profile?.display_name || ''
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error getting profile',
        error: error
      });
    }
  }
  
  /**
   * Updates the current user profile
   * @param req Express request object
   * @param res Express response object
   */
  public static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { displayName } = req.body;
      
      if (!displayName) {
        res.status(400).json({
          success: false,
          message: 'Display name is required'
        });
        return;
      }
      
      const user = await AuthService.getCurrentUser();
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }
      
      const updatedProfile = await AuthService.updateUserProfile(user.id, {
        display_name: displayName
      });
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          id: user.id,
          email: user.email,
          displayName: updatedProfile.display_name
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating profile',
        error: error
      });
    }
  }
}
import express from 'express';
import path from 'path';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { gameRouter } from './routes/gameRoutes';
import { authRouter } from './routes/authRoutes';
import { config } from './config/supabase';
import { DatabaseService } from './services/databaseService';

/**
 * Memory Game Server
 * This server handles image uploads and game logic for the memory card matching game
 */
class GameServer {
  public app: express.Application;
  public port: number;

  /**
   * Initializes the server with necessary middlewares and routes
   * @param port The port number the server will listen on
   */
  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.configureMiddleware();
    this.configureRoutes();
  }

  /**
   * Configures middleware for the express application
   */
  private configureMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(fileUpload({
      createParentPath: true,
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    }));
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  /**
   * Configures routes for the express application
   */
  private configureRoutes(): void {
    this.app.use('/api/game', gameRouter);
    this.app.use('/api/auth', authRouter);
    
    // Serve the main HTML file for any other route
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  /**
   * Starts the server on the specified port
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await DatabaseService.initDatabase();
      
      this.app.listen(this.port, () => {
        console.log(`Server is running on port ${this.port}`);
        console.log(`Connected to Supabase project: ${config.supabase.projectName}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Initialize and start the server
const server = new GameServer(config.port);
server.start();
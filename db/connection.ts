import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema';

class DatabaseConnection {
  private pool: pkg.Pool | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 5000; // 5 seconds

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const dbUrl = process.env.DATABASE_URL;
      console.log('Initializing database connection...', 
        dbUrl ? 'DATABASE_URL is set' : 'DATABASE_URL is missing');

      this.pool = new Pool({
        connectionString: dbUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000, // Increased from 2000 to 5000
        keepAlive: true, // Enable TCP keepalive
      });

      // Test connection
      await this.pool.query('SELECT 1');
      console.log('Database connection established successfully');

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;

      // Handle connection errors
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle client:', err);
        this.handleConnectionError();
      });

      // Handle pool events for better logging
      this.pool.on('connect', () => {
        console.log('New client connected to the pool');
      });

      this.pool.on('acquire', () => {
        console.log('Client acquired from the pool');
      });

      this.pool.on('remove', () => {
        console.log('Client removed from the pool');
      });

    } catch (error) {
      console.error('Failed to connect to database:', error);
      this.handleConnectionError();
    }
  }

  private async handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to database (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      // Close existing pool if it exists
      if (this.pool) {
        await this.pool.end().catch(err => 
          console.error('Error closing pool:', err)
        );
        this.pool = null;
      }

      // Wait before attempting to reconnect
      setTimeout(() => {
        this.initialize();
      }, this.reconnectInterval);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
      // Log additional details that might help diagnose the issue
      console.error('Connection details:', {
        timeoutMillis: 5000,
        maxPoolSize: 20,
        reconnectAttempts: this.reconnectAttempts,
        hasDbUrl: !!process.env.DATABASE_URL
      });
    }
  }

  public getDb() {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }
    return drizzle(this.pool, { schema });
  }

  // Method to force a reconnection (useful for testing)
  public async forceReconnect() {
    console.log('Forcing database reconnection...');
    await this.handleConnectionError();
  }
}

// Create a singleton instance
const connection = new DatabaseConnection();

// Export the database instance
export const db = connection.getDb();
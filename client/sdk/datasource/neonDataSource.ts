// Client-side adapter for the Neon PostgreSQL data source
import axios from "axios";

interface NeonDataSourceOptions {
  /** The UUID of the context with the Neon database plugin */
  contextUuid?: string;
  /** Authentication JWT token */
  jwt?: string;
}

/**
 * NeonDataSource class provides methods to interact with a Neon PostgreSQL database
 * through the web3db-connector plugin system
 */
export class NeonDataSource {
  contextUuid?: string;
  jwt?: string;

  /**
   * Create a new NeonDataSource instance
   * @param options - Configuration options
   */
  constructor(options: NeonDataSourceOptions = {}) {
    this.contextUuid = options.contextUuid;
    this.jwt = options.jwt;

    if (!this.contextUuid) {
      throw new Error("Context UUID is required for NeonDataSource");
    }
  }

  /**
   * Set the JWT token for authentication
   * @param jwt - The JWT token
   */
  setJwt(jwt: string) {
    this.jwt = jwt;
  }

  /**
   * Get the list of tables from the Neon database
   * @returns {Promise<Array>} - List of tables and their columns
   */
  async getTables() {
    try {
      const response = await axios.get(
        `/api/plugins/${this.contextUuid}/routes/tables`,
        {
          headers: {
            Authorization: this.jwt ? `Bearer ${this.jwt}` : undefined,
          },
        }
      );

      return response.data.tables || [];
    } catch (error) {
      console.error("Error retrieving tables from Neon database:", error);
      throw error;
    }
  }

  /**
   * Execute a SQL query on the Neon database
   * @param {string} query - SQL query to execute
   * @param {Array} params - Query parameters (for prepared statements)
   * @returns {Promise<Object>} - Query results
   */
  async query(query, params = []) {
    try {
      const response = await axios.post(
        `/api/plugins/${this.contextUuid}/routes/query`,
        {
          query,
          params,
        },
        {
          headers: {
            Authorization: this.jwt ? `Bearer ${this.jwt}` : undefined,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error executing query on Neon database:", error);
      throw error;
    }
  }

  /**
   * Import a table schema from the Neon database to create a Ceramic model
   * @param {string} tableName - Name of the table to import
   * @returns {Promise<Object>} - Schema definition for the model
   */
  async importTableSchema(tableName) {
    try {
      const response = await axios.post(
        `/api/plugins/${this.contextUuid}/routes/import-schema`,
        {
          tableName,
        },
        {
          headers: {
            Authorization: this.jwt ? `Bearer ${this.jwt}` : undefined,
          },
        }
      );

      return response.data.schema;
    } catch (error) {
      console.error("Error importing schema from Neon database:", error);
      throw error;
    }
  }

  /**
   * Create a new model based on a Neon database table
   * @param {string} tableName - Name of the table to create a model for
   * @param {string} modelName - Optional custom name for the model
   * @returns {Promise<Object>} - Created model information
   */
  async createModelFromTable(tableName, modelName = null) {
    try {
      // First import the table schema
      const schema = await this.importTableSchema(tableName);

      // If a custom model name is provided, use it
      if (modelName) {
        schema.name = modelName;
      }

      // Create a model using the schema
      // This would typically interact with the web3db-connector model creation API
      const response = await axios.post(
        "/api/models",
        {
          schema,
        },
        {
          headers: {
            Authorization: this.jwt ? `Bearer ${this.jwt}` : undefined,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error creating model from Neon table:", error);
      throw error;
    }
  }

  /**
   * Test the connection to the Neon database
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      return false;
    }
  }
}

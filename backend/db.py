import mysql.connector
from mysql.connector import Error


class Database:
    def __init__(self, db_config):
        self.db_config = db_config
        self.connection = None

    def connect(self):
        """Establish a connection to the MySQL database."""
        if self.connection is None or not self.connection.is_connected():
            try:
                self.connection = mysql.connector.connect(
                    host=self.db_config['host'],
                    user=self.db_config['user'],
                    password=self.db_config['password'],
                    database=self.db_config['dbname'],
                    port=self.db_config.get('port', 3306)  # Default MySQL port
                )
                if self.connection.is_connected():
                    print("Connected to the database successfully")
            except Error as e:
                print(f"Database Connection Failed: {e}")
                raise

    def execute_query(self, query, params=None, fetchone=False, fetchall=False):
        """Execute a query on the database."""        
        self.connect()  # Ensure the connection is open before executing the query
        try:
            cursor = self.connection.cursor(dictionary=True)  # Return results as dict
            cursor.execute(query, params)
            if fetchone:
                return cursor.fetchone()
            elif fetchall:
                return cursor.fetchall()
            else:
                self.connection.commit()
                return None
        except Error as e:
            print(f"Error executing query: {e}")
            self.connection.rollback()
            raise
        finally:
            cursor.close()

    def close(self):
        """Close the database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            self.connection = None
            print("Database connection closed")

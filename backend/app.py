from flask import Flask
from routes.vehicle import vehicle_route, init_blueprint
from db import Database
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db_host = os.getenv('DB_HOST')
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')

db_config = {
    'dbname': 'toyota_sense',
    'user': db_user,
    'password': db_password,
    'host': db_host,
    'port': 3306
}

app = Flask(__name__)
CORS(app)

db = Database(db_config=db_config)

# Pass the db instance to the blueprint
init_blueprint(db)

@app.before_request
def init_db():
    """Called before the first request is processed. Initialize the database connection."""
    db.connect()
    print("Database connected before request")

@app.teardown_appcontext
def close_db(exception):
    """Called after the request is finished. Close the database connection."""
    db.close()
    print("Database connection closed after request")


app.register_blueprint(vehicle_route, url_prefix='/api/vehicle')


@app.route('/')
def home():
    return "Hello, Hack!"

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask
from flask_cors import CORS, cross_origin


from flask_sqlalchemy import SQLAlchemy

file_list_cache = []

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

app.config.from_object('config')
db = SQLAlchemy(app)

from app import views, models

from flask import Flask
from flask_cors import CORS, cross_origin

file_list_cache = []

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

app.config.from_object('config')

from app import views, fitter

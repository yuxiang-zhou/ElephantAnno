import os
from flask import render_template
from app import app
from flask import Flask, request, redirect, url_for, Response
from flask import send_from_directory, jsonify, send_file
from werkzeug.utils import secure_filename
from pathlib import Path
import glob, json


@app.route('/')
@app.route('/index')
def index():
    user = {'nickname': 'Miguel'}
    posts = [
        {
            'author': {'nickname': 'John'},
            'body': 'Beautiful day in Portland!'
        },
        {
            'author': {'nickname': 'Susan'},
            'body': 'The Avengers movie was so cool!'
        }
    ]
    return render_template("index.html",
                           title='Home',
                           user=user,
                           posts=posts)

def get_list():
    file_path_list = []

    with open('./app/static/list.txt') as f:
        file_path_list = [{
            'id':i,
            'fullpath':p.strip()
        } for i,p in enumerate(f.readlines()) if len(p.strip()) > 0]
    # print(file_path_list)
    return file_path_list

@app.route('/api/filelist')
def filelist():

    return jsonify(get_list())


@app.route('/api/getvideo/<video_id>')
def getvideo(video_id):
    file_list_cache = get_list()
    filepath = Path(file_list_cache[int(video_id)]['fullpath'])
    print(filepath)
    print(str(filepath.parent),str(filepath.name))
    return send_from_directory(str(filepath.parent),str(filepath.name))


@app.route('/api/getanno/<video_id>')
def getanno(video_id):
    file_list_cache = get_list()
    target_json = Path(file_list_cache[int(video_id)]['fullpath']).with_suffix('.json')

    if target_json.exists():
        with open(str(target_json)) as data_file:
            anno = json.load(data_file)
            return jsonify(anno)

    else:
        return jsonify([])

@app.route('/api/saveanno/<video_id>', methods=['POST'])
def saveanno(video_id):
    file_list_cache = get_list()
    target_json = Path(file_list_cache[int(video_id)]['fullpath']).with_suffix('.json')
    content = request.data.decode('utf8')
    with open(str(target_json), 'w') as data_file:
        data_file.write(content)

    return content

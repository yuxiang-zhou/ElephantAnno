import os
import glob
import json

from pathlib import Path
from functools import wraps, update_wrapper
from datetime import datetime
from werkzeug.utils import secure_filename

from flask import render_template
from flask import Flask, request, redirect, url_for, Response
from flask import send_from_directory, jsonify, send_file
from flask import make_response

from app import app, fitter


def nocache(view):
    @wraps(view)
    def no_cache(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers['Last-Modified'] = datetime.now()
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return update_wrapper(no_cache, view)


def get_list():
    file_path_list = []

    with open('app/static/list.txt') as f:
        file_path_list = [{
            'id': i,
            'fullpath': p.strip()
        } for i, p in enumerate(f.readlines()) if len(p.strip()) > 0]
    return file_path_list


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


@app.route('/api/filelist')
@nocache
def filelist():

    return jsonify(get_list())


@app.route('/api/getdata/<data_id>')
@nocache
def getdata(data_id):
    file_list_cache = get_list()
    filepath = Path(file_list_cache[int(data_id)]['fullpath'])

    print(str(filepath.parent), str(filepath.parent).replace(
        '\\', '/'), str(filepath.name))
    return send_from_directory(str(filepath.parent).replace('\\', '/'), str(filepath.name))


@app.route('/api/getanno/<data_id>')
@nocache
def getanno(data_id):
    file_list_cache = get_list()
    filepath = file_list_cache[int(data_id)]['fullpath']

    target_json = Path(
        file_list_cache[int(data_id)]['fullpath']).with_suffix('.json')

    if target_json.exists():
        with open(str(target_json)) as data_file:
            data_anno = json.load(data_file)

            for anno in data_anno:
                if len(anno['lms']) != 16:
                    anno['lms'] = fitter.fit(filepath, anno['bbox'])

            return jsonify(data_anno)

    else:
        return jsonify([])


@app.route('/api/getlms/<data_id>/<x1>/<y1>/<x2>/<y2>')
@nocache
def getlms(data_id, x1, y1, x2, y2):
    file_list_cache = get_list()
    filepath = file_list_cache[int(data_id)]['fullpath']

    lms = fitter.fit(filepath, list(map(float, [x1, y1, x2, y2])))
    return jsonify(lms)


@app.route('/api/saveanno/<data_id>', methods=['POST'])
@nocache
def saveanno(data_id):
    file_list_cache = get_list()
    target_json = Path(
        file_list_cache[int(data_id)]['fullpath']).with_suffix('.json')
    content = request.data.decode('utf8')
    with open(str(target_json), 'w') as data_file:
        data_file.write(content)

    return content

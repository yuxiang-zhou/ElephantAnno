#!/vol/atlas/homes/yz4009/miniconda/envs/gitdev/bin/python
from app import app

app.run(debug=True,port=8102,host='0.0.0.0',threaded=True)

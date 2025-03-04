Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

python -m  venv deps

./deps/Scripts/activate.ps1

python main_logic2.py ./model_data/demo.json http://192.168.1.7:4747/video 1 5
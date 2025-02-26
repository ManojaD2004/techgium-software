Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

python -m  venv deps

./deps/Scripts/activate.ps1

docker build -t model-py -f dockerfile.python ./
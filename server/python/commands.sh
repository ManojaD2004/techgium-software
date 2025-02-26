Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

python -m  venv deps

./deps/Scripts/activate.ps1

docker build -t model-py -f dockerfile.python ./

docker run -p 5222:5222 -v "${PWD}/public/images:/app/images" -v "${PWD}/model_data:/app/model_data" -e PYTHONUNBUFFERED=1 --rm model-py python main_video2.py /app/model_data/demo.json http://192.168.1.7:4747/video 1

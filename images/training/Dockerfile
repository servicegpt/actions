FROM public.ecr.aws/lambda/python:3.8

RUN pip install --upgrade openai
RUN openai api fine_tunes.create -m ada --n_epochs 2 \
    -t https://cdn.openai.com/API/train-demo.json1
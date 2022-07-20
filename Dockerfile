FROM public.ecr.aws/lambda/nodejs:16

ENV CHROME_PATH=/usr/bin/chromium-browser

COPY app.js package*.json /var/task/

RUN npm install

RUN npm install chromium -g

CMD ["app.handler"]
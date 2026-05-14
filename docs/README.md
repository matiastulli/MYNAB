# MYNAB

**How to configure Python project?**

    1- Install python 3.11.6

    2- cd app/service

    3- python -m venv venv

    4- .\\venv\\Scripts\\activate

    5- pip install -r requirements.txt

    6- uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

**How to configure React project?**

    1- Install Node.js (recommended version 16.x or higher)

    2- cd app/client

    3- npm install

    4- npm run dev

**Docker utils**

    To get expose ip (inet) from Ubuntu:
    
        apt install net-tools
        ifconfig

    To inspect the Docker container for the mynab-services-1 image, use the following command:

        docker inspect mynab-services-1

    Send a GET request to the healthcheck endpoint:

        curl http://localhost:8000/healthcheck

**To use Alembic, do**

    Use to migrate orm changes in backend to database:

    1- cd app/service
    
    2- alembic init migrations

    3- alembic revision --autogenerate -m "First Migration"

    4- alembic upgrade head
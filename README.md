# MYNAB

**How to configure python project?**

    1- Install python 3.11.6

    2- python -m venv venv

    3- .\\venv\\Scripts\\activate

    4- pip install -r requirements.txt

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
    
        alembic init migrations

    alembic revision --autogenerate -m "First Migration"

    alembic upgrade head

**How to configure React project?**

    1- Navigate to the client directory:

        ```bash
        cd client
        ```

    2- Install Node.js (recommended version 16.x or higher)

    3- Install dependencies:

        ```bash
        npm install
        ```

**How to wake up the project?**

    service: uvicorn src.service.main:app --host 0.0.0.0 --port 8000 --reload

    client: npm run dev
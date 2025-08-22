from app import create_app, db
from flask_migrate import Migrate
from flask_cors import CORS

app = create_app()
CORS(app, 
     origins="*",
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])
migrate = Migrate(app, db)
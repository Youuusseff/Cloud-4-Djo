from flask import Flask
from .extensions import db, jwt
from .routes.auth import auth_bp
from .routes.sync import sync_bp
from .config import Config

print("app/__init__.py loaded")


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(sync_bp, url_prefix='/sync')
    return app
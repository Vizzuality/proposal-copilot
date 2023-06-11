from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


class User(UserMixin, db.Model):
    id = db.Column(db.String(100), primary_key=True)
    email = db.Column(db.String(100), unique=True)


class OAuth(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey(User.id))
    user = db.relationship(User)
    provider_user_id = db.Column(db.String(100))
    provider = db.Column(db.String(50))
    token = db.Column(db.JSON)
    refresh_token = db.Column(db.String(200))

from flask_sqlalchemy import SQLAlchemy
from flask_dance.consumer.storage.sqla import OAuthConsumerMixin
from flask_login import UserMixin

db = SQLAlchemy()


class User(UserMixin, db.Model):
    id = db.Column(db.String(100), primary_key=True)
    email = db.Column(db.String(100), unique=True)


class OAuth(OAuthConsumerMixin, db.Model):
    user_id = db.Column(db.String(100), db.ForeignKey(User.id))
    user = db.relationship(User)
    provider_user_id = db.Column(db.String(100))

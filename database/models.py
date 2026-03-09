from database.db import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    graphs = db.relationship('Graph', backref='owner', lazy=True)

class Graph(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    graph_type = db.Column(db.String(50), nullable=False)
    x_label = db.Column(db.String(100))
    y_label = db.Column(db.String(100))
    x_unit = db.Column(db.String(50))
    y_unit = db.Column(db.String(50))
    data_json = db.Column(db.Text, nullable=False)
    best_fit = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
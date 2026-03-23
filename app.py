from flask import Flask, render_template, request, redirect, url_for, session, jsonify, abort
from werkzeug.security import generate_password_hash, check_password_hash
import os, json
from database.db import db
from database.models import User, Graph

app = Flask(__name__)

# SECRET_KEY must be set as environment variable - no fallback allowed
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    raise RuntimeError("SECRET_KEY environment variable is not set!")
app.secret_key = secret_key

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'grafx.db')

db_url = os.environ.get("DATABASE_URL", "sqlite:///" + DB_PATH)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        if User.query.filter_by(email=email).first():
            return render_template('signup.html', error='Email already registered.')
        user = User(username=username, email=email, password=password)
        db.session.add(user)
        db.session.commit()
        session['user_id'] = user.id
        session['username'] = user.username
        return redirect(url_for('dashboard'))
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            return redirect(url_for('dashboard'))
        return render_template('login.html', error='Invalid credentials.')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    graphs = Graph.query.filter_by(user_id=session['user_id']).order_by(Graph.created_at.desc()).all()
    return render_template('dashboard.html', graphs=graphs)

@app.route('/graph/new')
@login_required
def new_graph():
    return render_template('graph.html', graph=None)

@app.route('/graph/<int:id>')
@login_required
def view_graph(id):
    graph = Graph.query.get_or_404(id)
    # Security: ensure user can only view their own graphs
    if graph.user_id != session['user_id']:
        abort(403)
    return render_template('graph.html', graph=graph)

@app.route('/graph/save', methods=['POST'])
@login_required
def save_graph():
    data = request.json
    graph = Graph(
        title=data['title'],
        graph_type=data['graph_type'],
        x_label=data['x_label'],
        y_label=data['y_label'],
        x_unit=data.get('x_unit', ''),
        y_unit=data.get('y_unit', ''),
        data_json=json.dumps(data['data']),
        best_fit=data.get('best_fit', False),
        user_id=session['user_id']
    )
    db.session.add(graph)
    db.session.commit()
    return jsonify({'success': True, 'id': graph.id})

@app.route('/graph/delete/<int:id>', methods=['POST'])
@login_required
def delete_graph(id):
    graph = Graph.query.get_or_404(id)
    if graph.user_id == session['user_id']:
        db.session.delete(graph)
        db.session.commit()
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
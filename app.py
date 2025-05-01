import sqlite3
from flask import Flask, render_template, request, jsonify, g

app = Flask(__name__)

# Database connection helper functions
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect('baby_shower_game.db')
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

# API endpoints
@app.route('/api/squares', methods=['GET'])
def get_squares():
    db = get_db()
    cursor = db.cursor()
    
    # Join squares with users to get both square and user information
    cursor.execute('''
        SELECT 
            squares.number, 
            users.first_name, 
            users.last_initial 
        FROM 
            squares 
        LEFT JOIN 
            users ON squares.user_id = users.id
        ORDER BY 
            squares.number
    ''')
    
    squares = []
    for row in cursor.fetchall():
        squares.append({
            'number': row['number'],
            'first_name': row['first_name'],
            'last_initial': row['last_initial'],
            'is_taken': row['first_name'] is not None
        })
    
    return jsonify(squares)

@app.route('/api/select-square', methods=['POST'])
def select_square():
    data = request.json
    square_number = data.get('number')
    first_name = data.get('first_name')
    last_initial = data.get('last_initial')
    email = data.get('email')
    payment_method = data.get('payment_method')
    
    if not all([square_number, first_name, last_initial, email, payment_method]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    # Check if square is already taken
    cursor.execute('SELECT user_id FROM squares WHERE number = ?', (square_number,))
    result = cursor.fetchone()
    
    if result['user_id'] is not None:
        return jsonify({'success': False, 'message': 'Square already taken'}), 409
    
    try:
        # Insert new user
        cursor.execute(
            'INSERT INTO users (first_name, last_initial, email, payment_method) VALUES (?, ?, ?, ?)',
            (first_name, last_initial, email, payment_method)
        )
        user_id = cursor.lastrowid
        
        # Update square with user ID
        cursor.execute(
            'UPDATE squares SET user_id = ? WHERE number = ?',
            (user_id, square_number)
        )
        
        db.commit()
        return jsonify({'success': True, 'message': 'Square selected successfully'})
    
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT 
            users.id,
            users.first_name,
            users.last_initial,
            users.email,
            users.payment_method,
            squares.number
        FROM 
            users
        JOIN 
            squares ON users.id = squares.user_id
        ORDER BY 
            users.id
    ''')
    
    users = []
    for row in cursor.fetchall():
        users.append({
            'id': row['id'],
            'first_name': row['first_name'],
            'last_initial': row['last_initial'],
            'email': row['email'],
            'payment_method': row['payment_method'],
            'square_number': row['number']
        })
    
    return jsonify(users)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
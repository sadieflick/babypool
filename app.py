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

@app.route('/api/clear-game', methods=['POST'])
def clear_game():
    game_id = request.json.get('game_id')
    db = get_db()
    cursor = db.cursor()
    cursor.execute('DELETE FROM users where user.game_id = ?', (game_id,))
    db.commit()
    return jsonify({'success': True, 'message': 'Game cleared successfully'})

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/api/create-game', methods=['POST'])
def create_game():
    data = request.json
    db = get_db()
    cursor = db.cursor()
    cursor.execute('INSERT INTO games (admin_id, expectant_first_name, expectant_last_name) VALUES (?, ?, ?)', (data['admin_id'], data['expectant_first_name'], data['expectant_last_name']))
    db.commit()
    game_id = cursor.lastrowid

    db = get_db()
    cursor = db.execute(f'SELECT * from games WHERE id= {game_id}')
    result = cursor.fetchone()
    game_data = {
        'id': result['id'],
        'admin_id': result['admin_id'],
        'expectant_first_name': result['expectant_first_name'],
        'expectant_last_name': result['expectant_last_name']
    }

    print(f"Game data returned: {game_data}")

    return jsonify({'success': True, 'message': 'Game created successfully', 'data': game_data})

# API endpoints
@app.route('/api/squares', methods=['GET'])
def get_squares():
    game_id = request.args.get('game_id')  # Get game_id from query parameters
    
    db = get_db()
    cursor = db.cursor()
    
    # Join squares with users to get both square and user information
    get_all_sql = '''
        SELECT 
            squares.number, 
            users.first_name, 
            users.last_initial,
            users.email,
            squares.game_id
        FROM 
            squares 
        LEFT JOIN 
            users ON squares.user_id = users.id
        WHERE 
            squares.game_id = ?
        ORDER BY 
            squares.number
    '''
    results = cursor.execute(get_all_sql, (game_id,)).fetchall()

    print(f'Game id at square render in app.py: {game_id}')
    squares = []
    
    if game_id == None or len(results) == 0:
        print(f"Squares not found" if len(results) == 0 else 'Game id not found?')
        sql_string = f'''INSERT INTO squares (number, user_id, game_id) VALUES '''
        for square in range(60):
            sql_string += f"({square + 1}, NULL, {game_id}), "
        sql_string = sql_string[:-2] + ';'
        print("SQL TO EXECUTE: ", sql_string)
        cursor.execute(sql_string)
        db.commit()
        cursor.execute(get_all_sql, (game_id,))

        results = cursor.fetchall()
    print(results)

    for row in results:
            squares.append({
                'number': row['number'],
                'first_name': row['first_name'],
                'last_initial': row['last_initial'],
                'email': row['email'],
                'is_taken': row['first_name'] is not None,
                'game_id': row['game_id']
            })
    
    return jsonify(squares)

@app.route('/api/create-user', methods=['POST'])
def create_user():

    print("create user called, data: ", request.json)
    data = request.json
    print("data: ", data)
    first_name = data.get('first_name')
    last_initial = data.get('last_initial')
    email = data.get('email')
    payment_method = data.get('payment_method')
    game_id = data.get('game_id')
    is_admin = data.get('is_admin')
    
    if not all([first_name, last_initial, email]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        # Insert new user
        cursor.execute(
            'INSERT INTO users (first_name, last_initial, email, payment_method, game_id, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
            (first_name, last_initial, email, payment_method, game_id, is_admin)
        )
        user_id = cursor.lastrowid
        db.commit()
        
        return jsonify({
            'success': True, 
            'message': 'User created successfully',
            'user_id': user_id,
            'first_name': first_name,
            'last_initial': last_initial,
            'email': email,
            'game_id': game_id,
            'is_admin': is_admin
        })
    
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/select-square', methods=['POST'])
def select_square():
    data = request.json
    print(f'Passed to the select suqare method: \n{data}\n')
    square_number = data.get('number')
    user_id = data.get('user_id')
    game_id = data.get('game_id')
    
    if not all([square_number, user_id, game_id]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    # Check if square is already taken in this game
    cursor.execute('SELECT user_id FROM squares WHERE number = ? AND game_id = ?', (square_number, game_id))
    result = cursor.fetchone()

    print(f'result in selecting square function: {result}')
    
    if result['user_id'] is not None:
        return jsonify({'success': False, 'message': 'Square already taken'}), 409
    
    try:
        # Update square with user ID
        cursor.execute(
            'UPDATE squares SET user_id = ? WHERE number = ? AND game_id = ?',
            (user_id, square_number, game_id)
        )
        
        db.commit()
        return jsonify({'success': True, 'message': 'Square selected successfully'})
    
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    
@app.route('/users/email', methods=['POST'])
def get_user():
    data = request.json
    print(data.get('email'))

    db = get_db()
    cursor = db.cursor()


    try:
        # fetch user by email
        cursor.execute(f'''
        SELECT 
            users.id,
            users.first_name,
            users.last_initial,
            users.email,
            users.payment_method,
            users.is_admin,
            users.game_id
        FROM 
            users
        WHERE email = ?''', (data.get('email'),))

        user_results = cursor.fetchone()
        print(user_results)
        
        return jsonify({
            'success': True, 
            'message': 'User fetched successfully',
            'user_id': user_results['id'],
            'first_name': user_results['first_name'],
            'last_initial': user_results['last_initial'],
            'email': user_results['email'],
            'is_admin': user_results['is_admin']
        })
    
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/users/<user_id>/<game_id>', methods=['GET'])
def set_game_id(user_id, game_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        UPDATE users
        SET game_id = ?
        WHERE id = ?;
    ''', (user_id, game_id))

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

@app.route('/api/remove-selection', methods=['POST'])
def remove_selection():
    data = request.json
    square_number = data.get('number')
    # email = data.get('email')
    
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('UPDATE squares SET user_id = NULL WHERE number = ?', (square_number,))
    db.commit()
    return jsonify({'success': True, 'message': 'Square removed successfully'})
    


if __name__ == '__main__':
    app.run(debug=True, port=8000)
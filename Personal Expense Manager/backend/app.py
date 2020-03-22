import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)


db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root123$_",
    database="expense_tracker",
)
cursor = db.cursor(dictionary=True)


@app.route('/expenses', methods=['GET'])
def get_expenses():
    cursor.execute("SELECT * FROM expenses")
    expenses = cursor.fetchall()
    return jsonify(expenses)

@app.route('/expenses', methods=['POST'])
def add_expense():
    print("\n\n Inside the POST Method")
    data = request.json
    print(data)
    sql = "INSERT INTO expenses (description, category, amount, date) VALUES (%s, %s, %s, %s)"
    values = (data['description'], data['category'], data['amount'], data['date'])

    print(f"values are: {values}")

    cursor.execute(sql, values)
    db.commit()
    
    expense_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
    saved_expense = cursor.fetchone()
    
    return jsonify(saved_expense), 201

@app.route('/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    cursor.execute("DELETE FROM expenses WHERE id = %s", (id,))
    db.commit()
    return jsonify({"message": "Expense deleted successfully"})

@app.route('/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    data = request.json
    sql = "UPDATE expenses SET description = %s, category = %s, amount = %s, date = %s WHERE id = %s"
    values = (data['description'], data['category'], data['amount'], data['date'], id)
    cursor.execute(sql, values)
    db.commit()
    return jsonify({"message": "Expense updated successfully"})

@app.route('/transactions', methods=['GET'])
def get_income_transactions():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    print("\n\n")
    print(f"Start Date: {start_date}")
    print(f"End Date: {end_date}")

    sql = """
        SELECT * FROM expenses 
        WHERE date BETWEEN %s AND %s
    """
    values = (start_date, end_date)
    
    cursor.execute(sql, values)
    transactions = cursor.fetchall()
    
    return jsonify(transactions)

if __name__ == '__main__':
    app.run(debug=True)

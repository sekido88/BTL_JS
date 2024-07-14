from flask import Flask, render_template,request
from flask import jsonify

import psycopg2
import psycopg2.extras
import logging 
import json

from datetime import date, datetime
from function_app import send_email_confirm_v2,Get_Db_Connection,Custom_Serializer,Format_Date

app = Flask(__name__)

# Model 
class Order:
    def __init__(self, order_id, customer_name, customer_email, date, total_amount, status, table_number):
        self.order_id = order_id
        self.customer_name = customer_name
        self.customer_email = customer_email
        self.date = date
        self.total_amount = total_amount
        self.items = []
        self.status = status
        self.table_number = table_number

    def add_item(self, order_detail_id, product_id, product_name, quantity, price, status, image_url):
        item = Item(order_detail_id, product_id, product_name, quantity, price, status, image_url)
        self.items.append(item)
    
    def to_dict(self):
        return {
            'order_id': self.order_id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'date': self.date,
            'total_amount': self.total_amount,
            'status': self.status,
            'table_number': self.table_number,
            'items': [item.to_dict() for item in self.items]
        }

class Item:
    def __init__(self, order_detail_id, product_id, product_name, quantity, price, status, image_url):
        self.order_detail_id = order_detail_id
        self.product_id = product_id
        self.product_name = product_name
        self.quantity = quantity
        self.price = price
        self.status = status
        self.image_url = image_url

    def to_dict(self):
        return {
            'order_detail_id': self.order_detail_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'price': self.price,
            'status': self.status,
            'image_url': self.image_url
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_reservation', methods=['POST'])
def process_reservation():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        reservation_date = request.form['date']
        reservation_time = request.form['time']
        num_guests = request.form['seats']
        special_requests = request.form.get('special_requests', '')
        submission_time = datetime.now().time()

        try:
            conn = Get_Db_Connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

            cursor.execute("SELECT customer_id FROM customers WHERE email = %s", (email,))
            existing_customer = cursor.fetchone()

            if existing_customer:
                customer_id = existing_customer['customer_id']
            else:
                cursor.execute("INSERT INTO customers (name, email, phone) VALUES (%s, %s, %s) RETURNING customer_id", (name, email, phone))
                customer_id = cursor.fetchone()['customer_id']

            cursor.execute("""
                INSERT INTO reservations (customer_id, reservation_date, reservation_time, submission_time, num_guests, special_requests, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                RETURNING reservation_id
            """, (customer_id, reservation_date, reservation_time, submission_time, num_guests, special_requests))
            reservation_id = cursor.fetchone()['reservation_id']

            conn.commit()

            send_email_confirm_v2(email, reservation_id, submission_time, name, reservation_date, reservation_time, num_guests, special_requests)

            return jsonify({'status': 'success', 'message': 'Đã nhận dữ liệu và gửi email xác nhận', 'reservation_id': reservation_id, 'customer_id': customer_id})

        except Exception as e:
            logging.error("Error occurred: %s", str(e))
            return jsonify({'status': 'error', 'message': 'Đã xảy ra lỗi, vui lòng kiểm tra log.'})

@app.route('/home')
def home():
    return render_template('home.html')
@app.route('/about_us')
def about_us():
    return render_template('about_us.html')
@app.route('/find_us')
def find_us():
    return render_template('find_us.html')


@app.route('/generate_client_id', methods=['POST'])
def generate_client_id():
    try:
        conn = Get_Db_Connection()
        cursor = conn.cursor()

        cursor.execute("INSERT INTO customers (name, email) VALUES ('Anonymous', 'anonymous@gmail.com') RETURNING customer_id")
        new_customer_id = cursor.fetchone()[0]

        new_email = f"{new_customer_id}anonymous@gmail.com"
        cursor.execute("UPDATE customers SET email = %s WHERE customer_id = %s", (new_email, new_customer_id))
        
        conn.commit()

        return jsonify({'client_id': new_customer_id})

    except (Exception, psycopg2.Error) as error:
        print("Error generating client ID:", error)
        conn.rollback()
        return jsonify({'error': 'Lỗi khi tạo client ID'}), 500

    finally:
        if conn:
            cursor.close()
            conn.close()

@app.route('/menu_order')
def menu_order():
    try:
        with Get_Db_Connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                cursor.execute("SELECT * FROM products ORDER BY category, product_name")
                products = cursor.fetchall()
        return render_template('menu_order.html', products=products)
    except Exception as e:
        logging.error("Error in menu_order: %s", str(e))
        return "An error occurred.", 500
    
@app.route('/place_order', methods=['POST'])
def place_order():
    data = request.get_json()
    client_id = data.get('client_id')
    total_amount = data.get('total_amount')
    items = data.get('items')

    if not client_id or not total_amount or not items:
        return jsonify({'success': False, 'error': 'Thiếu dữ liệu cần thiết'}), 400

    try:
        conn = Get_Db_Connection()
        cursor = conn.cursor()

        email = f'{client_id}anonymous@gmail.com'
        cursor.execute("SELECT customer_id FROM customers WHERE email = %s", (email,))
        existing_customer = cursor.fetchone()

        if existing_customer:
            customer_id = existing_customer[0]
        else:
            cursor.execute("INSERT INTO customers (name, email) VALUES (%s, %s) RETURNING customer_id", ('Anonymous', email))
            customer_id = cursor.fetchone()[0]

        cursor.execute("INSERT INTO orders (customer_id, total_amount, table_number) VALUES (%s, %s, %s) RETURNING order_id", (customer_id, total_amount, data.get('table_number')))
        order_id = cursor.fetchone()[0]

        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity')
            price = item.get('price')

            if product_id and quantity and price:
                cursor.execute("INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)", (order_id, product_id, quantity, price))

        conn.commit()

        return jsonify({'success': True, 'order_id': order_id, 'customer_id': customer_id}), 200

    except Exception as e:
        logging.error("Lỗi trong place_order: %s", str(e))
        conn.rollback()  # Thêm dòng này để rollback nếu có lỗi
        return jsonify({'success': False, 'error': 'Đã xảy ra lỗi'}), 500

    finally:
        cursor.close()
        conn.close()       

@app.route('/my_order', methods=['GET', 'POST'])
def my_order():
    if request.method == 'GET':
        return render_template('my_order.html')
    else:
        client_id = request.form.get('client_id')
        if not client_id:
            return jsonify({'error': 'Client ID is required'}), 400
        orders = get_orders_by_client_id(client_id)
        return jsonify([order.to_dict() for order in orders]), 200, {'ContentType': 'application/json'}

def get_orders_by_client_id(client_id):
    try:
        with Get_Db_Connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                query = """
                    SELECT
                        o.order_id,
                        o.status AS order_status,
                        o.table_number,
                        c.name AS customer_name,
                        c.email AS customer_email,
                        o.order_date AS date,
                        o.total_amount,
                        od.order_detail_id,
                        od.product_id,
                        p.product_name,
                        od.quantity,
                        od.price,
                        od.status AS item_status,
                        p.image_url
                    FROM orders o
                    JOIN customers c ON o.customer_id = c.customer_id
                    LEFT JOIN order_details od ON o.order_id = od.order_id
                    LEFT JOIN products p ON od.product_id = p.product_id
                    WHERE c.customer_id = %s
                    ORDER BY o.order_date DESC
                """
                cursor.execute(query, (client_id,))
                orders_data = cursor.fetchall()

        orders = []
        for order_data in orders_data:
            order_id = order_data['order_id']
            existing_order = next((order for order in orders if order.order_id == order_id), None)

            if existing_order:
                order_obj = existing_order
                if order_data['product_id']:
                    order_obj.add_item(
                        order_data['order_detail_id'],
                        order_data['product_id'],
                        order_data['product_name'],
                        order_data['quantity'],
                        order_data['price'],
                        order_data['item_status'],
                        order_data['image_url']
                    )
            else:
                order_obj = Order(
                    order_id,
                    order_data['customer_name'],
                    order_data['customer_email'],
                    order_data['date'],
                    order_data['total_amount'],
                    order_data['order_status'],
                    order_data['table_number']
                )
                if order_data['product_id']:
                    order_obj.add_item(
                        order_data['order_detail_id'],
                        order_data['product_id'],
                        order_data['product_name'],
                        order_data['quantity'],
                        order_data['price'],
                        order_data['item_status'],
                        order_data['image_url']
                    )
                orders.append(order_obj)

        return orders

    except psycopg2.Error as e:
        logging.error("Database error in get_orders_by_client_id: %s", str(e))
        return []
    except Exception as e:
        logging.error("Error in get_orders_by_client_id: %s", str(e))
        return []

@app.route('/my_reservation')
def my_reservation():
    return render_template('my_reservation.html')

@app.route('/search_reservation', methods=['POST'])
def search_reservation():
    reservation_id = request.form.get('search_query')
    if not reservation_id:
        return jsonify({"error": "Mã đặt chỗ không hợp lệ."}), 400

    conn = Get_Db_Connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    try:
        cursor.execute("""
            SELECT r.reservation_id, c.name, c.email, r.reservation_date as date,
                   r.reservation_time as time, r.num_guests as seats,
                   r.special_requests, r.status
            FROM reservations r
            JOIN customers c ON r.customer_id = c.customer_id
            WHERE r.reservation_id = %s
        """, (reservation_id,))

        reservations = cursor.fetchall()
        
    
        json_data = json.dumps({"reservations": [dict(r) for r in reservations]}, default=Custom_Serializer)

        return jsonify(json.loads(json_data)), 200

    except Exception as e:
        app.logger.error("Error in search_reservation: %s", str(e))
        return jsonify({"error": "Có lỗi xảy ra."}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/sort_reservations', methods=['POST'])
def sort_reservations():
    sort_criteria = request.form.get('sort_criteria')
    valid_sort_criteria = {'date': 'r.reservation_date', 'name': 'c.name', 'email': 'c.email', 'status': 'r.status'}
    
    if sort_criteria not in valid_sort_criteria:
        return jsonify({'error': 'Tiêu chí sắp xếp không hợp lệ'}), 400
    
    try:
        with Get_Db_Connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                query = f"""
                    SELECT r.reservation_id, c.name, c.email, r.reservation_date, r.reservation_time,
                           r.submission_time, r.num_guests, r.special_requests, r.status
                    FROM reservations r
                    JOIN customers c ON r.customer_id = c.customer_id
                    ORDER BY {valid_sort_criteria[sort_criteria]}
                """
                cursor.execute(query)
                reservations_data = cursor.fetchall()
        
        reservations_list = [{
            'id': res['reservation_id'],
            'name': res['name'],
            'email': res['email'],
            'date': Custom_Serializer(res['reservation_date']),
            'time': Custom_Serializer(res['reservation_time']),
            'submission_time': Custom_Serializer(res['submission_time']),
            'seats': res['num_guests'],
            'special_requests': res['special_requests'].strip(),
            'status': res['status']
        } for res in reservations_data]
        
        return jsonify({'reservations': reservations_list}), 200
    except psycopg2.Error as e:
        logging.error("Database error in sort_reservations: %s", str(e))
        return jsonify({'error': 'Lỗi cơ sở dữ liệu'}), 500
    except Exception as e:
        logging.error("Error in sort_reservations: %s", str(e))
        return jsonify({'error': 'Lỗi không xác định'}), 500

from datetime import date, timedelta


@app.route('/admin')
def admin():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        with Get_Db_Connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                query = """
                    SELECT r.reservation_id, c.name, c.email, r.reservation_date, r.reservation_time,
                           r.submission_time, r.num_guests, r.special_requests, r.status
                    FROM reservations r
                    JOIN customers c ON r.customer_id = c.customer_id
                """
                
                if start_date and end_date:
                    query += " WHERE DATE(r.reservation_date) BETWEEN %s AND %s"
                    cursor.execute(query + " ORDER BY r.reservation_date, r.reservation_time", (start_date, end_date))
                else:
                    today = date.today()
                    tomorrow = today + timedelta(days=1)
                    query += " WHERE DATE(r.reservation_date) BETWEEN %s AND %s"
                    cursor.execute(query + " ORDER BY r.reservation_date, r.reservation_time", (today, tomorrow))
                
                reservations_data = cursor.fetchall()
                print(reservations_data)
        
        reservations = [
            {
                'id': res['reservation_id'],
                'name': res['name'],
                'email': res['email'],
                'date': Custom_Serializer(res['reservation_date']),
                'time': Custom_Serializer(res['reservation_time']),
                'submission_time': Custom_Serializer(res['submission_time']),
                'seats': res['num_guests'],
                'special_requests': res['special_requests'].strip() if res['special_requests'] else '',
                'status': res['status']
            } for res in reservations_data
        ]
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'reservations': reservations})
        else:
            return render_template('admin.html', reservations=reservations)
    except Exception as e:
        logging.error("Error in admin: %s", str(e))
        return jsonify({'error': 'An error occurred'}), 500
    
@app.route('/admin/update_reservation_status', methods=['POST'])
def update_reservation_status():
    reservation_id = request.form.get('reservation_id')
    new_status = request.form.get('status')
    
    if not reservation_id or not new_status:
        return jsonify({'status': 'error', 'message': 'Thiếu thông tin cần thiết.'}), 400

    try:
        with Get_Db_Connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE reservations SET status = %s WHERE reservation_id = %s", (new_status, reservation_id))
                conn.commit()
        
        return jsonify({'status': 'success', 'message': 'Đã cập nhật trạng thái đặt chỗ'}), 200
    
    except psycopg2.Error as e:
        logging.error("Database error in update_reservation_status: %s", str(e))
        return jsonify({'status': 'error', 'message': 'Lỗi cơ sở dữ liệu.'}), 500
    except Exception as e:
        logging.error("Error in update_reservation_status: %s", str(e))
        return jsonify({'status': 'error', 'message': 'Lỗi không xác định.'}), 500

@app.route('/login')
def login():
    return render_template('login.html')


@app.route('/admin/orders')
def admin_orders():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        with Get_Db_Connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                query = """
                    SELECT o.order_id, o.status as order_status, c.name as customer_name, c.email as customer_email,
                        o.order_date, o.total_amount, od.order_detail_id, od.product_id,
                        p.product_name, od.quantity, od.price, od.status, o.table_number, p.image_url
                    FROM orders o
                    JOIN customers c ON o.customer_id = c.customer_id
                    LEFT JOIN order_details od ON o.order_id = od.order_id
                    LEFT JOIN products p ON od.product_id = p.product_id
                """
                
                if start_date and end_date:
                    query += " WHERE DATE(o.order_date) >= DATE(%s) AND DATE(o.order_date) <= DATE(%s)"
                    cursor.execute(query + " ORDER BY o.order_date DESC", (start_date, end_date))
                else:
                    
                    today = date.today().isoformat()
                    query += " WHERE DATE(o.order_date) = DATE(%s)"
                    cursor.execute(query + " ORDER BY o.order_date DESC", (today,))
                
                orders_data = cursor.fetchall()

        orders = []
        for order in orders_data:
            order_id = order['order_id']
            customer_name = order['customer_name']
            customer_email = order['customer_email']
            order_date = Format_Date(order['order_date'])
            total_amount = order['total_amount']
            order_status = order['order_status']

            existing_order = next((o for o in orders if o.order_id == order_id), None)
            if existing_order:
                order_obj = existing_order
            else:
                order_obj = Order(order_id, customer_name, customer_email, order_date, total_amount, order_status, order['table_number']) 
                orders.append(order_obj)

            if order['product_id']:
                order_obj.add_item(
                    order['order_detail_id'],
                    order['product_id'],
                    order['product_name'],
                    order['quantity'],
                    order['price'],
                    order['status'],
                    order['image_url']
                )

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'orders': [order.to_dict() for order in orders]})
        else:
            return render_template('admin_orders.html', orders=orders)

    except psycopg2.Error as e:
        print("Database error in admin_orders:", str(e))
        return "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu.", 500
    except TypeError as e:
        print("Type error in admin_orders:", str(e))
        return "Đã xảy ra lỗi không xác định.", 500
    except Exception as e:
        print("Error in admin_orders:", str(e))
        return "Đã xảy ra lỗi không xác định.", 500


@app.route('/admin/update_order_status', methods=['POST'])
def update_order_status():
    order_id = request.form.get('order_id')
    status = request.form.get('status')

    if not order_id or not status:
        return jsonify({'status': 'error', 'message': 'Thiếu thông tin cần thiết.'}), 400

    try:
        with Get_Db_Connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE orders SET status = %s WHERE order_id = %s", (status, order_id))
                conn.commit()

        return jsonify({'status': 'success', 'message': 'Đã cập nhật trạng thái đơn hàng'}), 200

    except psycopg2.Error as e:
        logging.error("Database error in update_order_status: %s", str(e))
        return jsonify({'status': 'error', 'message': 'Lỗi cơ sở dữ liệu.'}), 500
    except Exception as e:
        logging.error("Error in update_order_status: %s", str(e))
        return jsonify({'status': 'error', 'message': 'Lỗi không xác định.'}), 500

@app.route('/admin/update_order_item_status', methods=['POST'])
def update_order_item_status():
    order_detail_id = request.form.get('order_detail_id')
    status = request.form.get('status')

    if not order_detail_id or not status:
        return jsonify({'status': 'error', 'message': 'Thiếu thông tin cần thiết.'}), 400

    try:
        with Get_Db_Connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE order_details SET status = %s WHERE order_detail_id = %s", (status, order_detail_id))
                conn.commit()

        return jsonify({'status': 'success', 'message': 'Đã cập nhật trạng thái món ăn'}), 200

    except psycopg2.Error as e:
        logging.error("Database error in update_order_item_status: %s", str(e))
        return jsonify({'status': 'loi', 'message': 'loi'})
    
if __name__ == '__main__':
    app.run(debug=True)
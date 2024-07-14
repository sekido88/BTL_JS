import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import time,date
import psycopg2
import psycopg2.extras
def send_email_confirm_v2(input_email_sent, reservation_id, submission_time, name, date, time, guests, special_requests):
    email = 'dominh38888@gmail.com'
    password = 'uejh zyqj fcwi pngt'
    email_sent = input_email_sent 

    subject = "Đặt chỗ tại nhà hàng BunCha"
    body = f"""
    Xin chào {name},

    Cảm ơn bạn đã đặt chỗ tại nhà hàng của chúng tôi.
    Dưới đây là thông tin đặt chỗ của bạn:

    - Mã đặt chỗ: {reservation_id}
    - Thời gian gửi yêu cầu: {submission_time.strftime('%Y-%m-%d %H:%M:%S')}
    - Ngày hẹn: {date}
    - Thời gian: {time}
    - Số khách: {guests}
    - Yêu cầu đặc biệt: {special_requests}

    Vui lòng giữ mã đặt chỗ để tra cứu .

    Trân trọng,
    Nhà hàng BunCha
    """

    msg = MIMEMultipart()
    msg['From'] = email
    msg['To'] = email_sent
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        session = smtplib.SMTP('smtp.gmail.com', 587)
        session.starttls()
        session.login(email, password)
        session.sendmail(email, email_sent, msg.as_string())
        print('Email đã được gửi thành công!')
    except Exception as e:
        print(f'Có lỗi xảy ra khi gửi email: {e}')
    finally:
        session.quit()

def PorocessDataEmail(reservations) :
        for i in reservations :
            tmp = i['email'].split('@') 
            i['email'] = tmp[0] + '\n' + '@' + tmp[1]

def Get_Db_Connection():
    
    DB_HOST = 'localhost'
    DB_NAME = 'restaurant'
    DB_USER = 'postgres'
    DB_PORT = '5432'
    DB_PASS = 'admin'
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    return conn

def Custom_Serializer(obj):

    if isinstance(obj, date):
        return obj.strftime("%Y-%m-%d")
    elif isinstance(obj, time):
        return obj.strftime("%H:%M")
    raise TypeError(f"Type {type(obj)} not serializable")

def Format_Date(date):
     return date.strftime("%a, %d %b %Y %H:%M:%S GMT")
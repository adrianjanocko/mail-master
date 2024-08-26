import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import mysql.connector
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

from config import DB_CONFIG, EMAIL_CONFIG

app = Flask(__name__)
CORS(app)


def create_connection():
    return mysql.connector.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database']
    )


@app.route('/emails', methods=['POST'])
def add_email():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    if email and name:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO emails (email, name) VALUES (%s, %s)", (email, name))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Email added successfully"}), 201
    else:
        return jsonify({"error": "Invalid input"}), 400


@app.route('/emails', methods=['PUT'])
def edit_email():
    data = request.json
    old_email = data.get('oldEmail')
    new_email = data.get('newEmail')
    name = data.get('name')

    if old_email and new_email and name:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE emails SET email = %s, name = %s WHERE email = %s", (new_email, name, old_email))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Email updated successfully"}), 200
    else:
        return jsonify({"error": "Invalid input"}), 400


@app.route('/emails', methods=['DELETE'])
def remove_email():
    data = request.json
    email = data.get('email')
    if email:
        conn = create_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM emails WHERE email = %s", (email,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Email removed successfully"}), 200
    else:
        return jsonify({"error": "Invalid input"}), 400


@app.route('/emails', methods=['GET'])
def get_all_emails():
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM emails")
    emails = [{'id': row[0], 'email': row[1], 'name': row[2]} for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(emails), 200


def connect_mail() -> smtplib.SMTP_SSL:
    if not all(EMAIL_CONFIG.values()):
        app.logger.error("Mail is not properly configured!")
        return exit(2)

    try:
        smtp = smtplib.SMTP_SSL(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port'])
        smtp.ehlo()
        smtp.login(EMAIL_CONFIG['sender_email'], EMAIL_CONFIG['sender_password'])
        return smtp
    except Exception as e:
        app.logger.error(f"Failed to connect to SMTP server: {e}")
        return exit(2)


def get_email_info_by_id(user_id):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM emails WHERE id = %s", (user_id,))
    result = cursor.fetchone()
    if result:
        columns = [desc[0] for desc in cursor.description]
        email_info = dict(zip(columns, result))
    else:
        email_info = None
    cursor.close()
    conn.close()
    return email_info


@app.post('/send-email')
def send_email():
    data = request.json
    subject = data.get('subject')
    user_ids = data.get('to_emails')

    if not all([subject, user_ids]):
        return jsonify({"error": "Invalid input"}), 400

    for user_id in user_ids:
        email_info = get_email_info_by_id(user_id)
        if email_info:
            email = email_info.get('email')
            name = email_info.get('name')
            if email and name:
                message = MIMEMultipart()
                message["Subject"] = subject
                message["From"] = EMAIL_CONFIG['sender_email']
                message["To"] = email

                html_body = render_template('email_template.html', name=name, content=data.get('content'),
                                            year=datetime.datetime.now().year)
                message.attach(MIMEText(html_body, 'html'))

                try:
                    smtp = connect_mail()
                    smtp.sendmail(EMAIL_CONFIG['sender_email'], email, message.as_string())
                    smtp.quit()
                    print(f"Email sent successfully to {email}")
                except Exception as e:
                    return jsonify({"error": f"Failed to send email to {email}: {e}"}), 500
            else:
                app.logger.error(f"Email or name not found for user ID: {user_id}")
        else:
            app.logger.error(f"No data found for user ID: {user_id}")

    return jsonify({"message": "All emails sent successfully"}), 200


if __name__ == '__main__':
    app.run(debug=True)

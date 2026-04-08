import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import urllib.parse
import http.client

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# Configuración del bot de Telegram
api_token = os.getenv('API_TOKEN')
chat_id = os.getenv('CHAT_ID')

# Función para enviar mensajes por Telegram
def send_telegram_message(message):
    try:
        conn = http.client.HTTPSConnection("api.telegram.org")
        params = urllib.parse.urlencode({
            'chat_id': chat_id,
            'text': message
        })
        url = f"/bot{api_token}/sendMessage?{params}"
        conn.request("GET", url)
        response = conn.getresponse()
        data = response.read().decode()
        conn.close()

        if response.status == 200:
            print("Mensaje enviado correctamente")
            return True
        else:
            print(f"Error al enviar el mensaje: {data}")
            return False
    except Exception as e:
        print(f"Error en la conexión con Telegram: {e}")
        return False

# Endpoint para enviar mensajes por Telegram
@app.route('/send-telegram', methods=['POST'])
def send_telegram_endpoint():
    data = request.json
    message = data.get('message', 'Mensaje por defecto')
    success = send_telegram_message(message)
    if success:
        return jsonify({'message': 'Mensaje enviado correctamente'}), 200
    else:
        return jsonify({'message': 'Error al enviar el mensaje'}), 500

# Función para enviar correos electrónicos
def send_email(subject, recipient_email, body_html):
    email_sender = os.getenv('GoogleMail__EmailSender')
    email_password = os.getenv('GoogleMail__ApiKey')
    smtp_server = os.getenv('GoogleMail__Host')
    smtp_port = os.getenv('GoogleMail__Port')

    msg = MIMEMultipart()
    msg['From'] = email_sender
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body_html, 'html'))

    try:
        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.starttls()
            server.login(email_sender, email_password)
            server.sendmail(email_sender, recipient_email, msg.as_string())
        print("Correo enviado correctamente")
        return True, ""
    except Exception as e:
        error_msg = str(e)
        print(f"Error al enviar el correo: {error_msg}")
        return False, error_msg

# Endpoint para enviar correos electrónicos
@app.route('/send-email', methods=['POST'])
def send_email_endpoint():
    data = request.json
    subject = data.get('subject')
    recipient = data.get('recipient')
    body_html = data.get('body_html')

    success, error_msg = send_email(subject, recipient, body_html)
    if success:
        return jsonify({'message': 'Correo enviado correctamente'}), 200
    else:
        return jsonify({'message': 'Error al enviar el correo', 'detail': error_msg}), 500

if __name__ == '__main__':
    print("Servidor iniciado...")
    app.run(debug=True)

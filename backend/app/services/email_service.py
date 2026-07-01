import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.hostinger.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 465))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_pass = os.getenv("SMTP_PASS", "")

    def send_fulfillment_email(self, order_folio: str, customer_email: str, customer_name: str, shipments_data: list):
        """
        Envia el correo al cliente con los números de guía para cada paquete del pedido.
        """
        if not self.smtp_user or not self.smtp_pass:
            print("No SMTP credentials configured. Simulating email sending...")
            print(f"To: {customer_email}")
            print(f"Subject: Tu pedido {order_folio} ha sido procesado")
            print(f"Shipments: {shipments_data}")
            return True

        subject = f"¡Tu pedido {order_folio} está en camino!"
        
        # HTML básico para el correo
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hola {customer_name},</h2>
                <p>Tu pedido <strong>{order_folio}</strong> ha sido procesado y tus guías de envío han sido generadas.</p>
                <p>Aquí están los detalles de rastreo de tus paquetes:</p>
                <ul>
        """
        
        for idx, shipment in enumerate(shipments_data):
            carrier = shipment.get("carrier", "Paquetería")
            tracking = shipment.get("tracking_number", "Pendiente")
            label_url = shipment.get("label_url", "#")
            html_content += f"<li><strong>Paquete {idx + 1} ({carrier}):</strong> Rastreo: <a href='{label_url}'>{tracking}</a></li>"
            
        html_content += """
                </ul>
                <p>Puedes dar seguimiento a tus paquetes desde tu panel de cliente en Gamer Loot.</p>
                <br>
                <p>¡Gracias por tu compra!</p>
                <p><strong>El equipo de Gamer Loot</strong></p>
            </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Gamer Loot <{self.smtp_user}>"
        msg["To"] = customer_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        try:
            # Usar SSL para Hostinger (puerto 465)
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                server.login(self.smtp_user, self.smtp_pass)
                server.sendmail(self.smtp_user, customer_email, msg.as_string())
            print(f"Correo de fulfillment enviado exitosamente a {customer_email}")
            return True
        except Exception as e:
            print(f"Error enviando correo de fulfillment a {customer_email}: {e}")
            return False

    def send_admin_supplier_email(self, order_folio: str, shipments_data: list):
        """
        Envia el correo al administrador con las guías (PDFs) para mandarlas a los proveedores.
        """
        admin_email = "ventas@gamerloot.com, contacto@gamerloot.com.mx" # o de .env
        if not self.smtp_user or not self.smtp_pass:
            print(f"Simulando correo al ADMIN ({admin_email}) con guías de pedido {order_folio}...")
            return True

        subject = f"Nuevas Guías Generadas - Pedido {order_folio}"
        html_content = f"<h2>Guías Generadas para el Pedido {order_folio}</h2>"
        html_content += "<p>Por favor, envía las siguientes guías a los proveedores correspondientes para su despacho y recolección:</p><ul>"
        
        for idx, shipment in enumerate(shipments_data):
            carrier = shipment.get("carrier", "Paquetería")
            label_url = shipment.get("label_url", "#")
            origin = shipment.get("origin_zip", "Desconocido")
            html_content += f"<li><strong>Bodega CP {origin} ({carrier}):</strong> Descargar Guía: <a href='{label_url}'>PDF</a></li>"
            
        html_content += "</ul><p>Recuerda programar la recolección en Mienvío una vez que el proveedor confirme el empaquetado.</p>"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Gamer Loot System <{self.smtp_user}>"
        msg["To"] = admin_email

        msg.attach(MIMEText(html_content, "html"))

        try:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                server.login(self.smtp_user, self.smtp_pass)
                admin_emails_list = [e.strip() for e in admin_email.split(",")]
                server.sendmail(self.smtp_user, admin_emails_list, msg.as_string())
            print(f"Correo admin enviado exitosamente.")
            return True
        except Exception as e:
            print(f"Error enviando correo admin: {e}")
            return False

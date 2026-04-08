package com.esrg.ms_security.Services;

import com.esrg.ms_security.Models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${notifications.url}")
    private String notificationsUrl;

    /**
     * Envía un correo de confirmación de registro.
     * @param user El usuario recién registrado.
     */
    public void sendRegistrationEmail(User user) {
        String subject = "¡Bienvenido a Smart Buses!";
        
        String htmlTemplate = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #1d4ed8; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">Smart Buses</h1>
                    </div>
                    <div style="padding: 40px 40px;">
                        <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">¡Bienvenido/a, %s!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Tu cuenta ha sido creada exitosamente. Estamos encantados de tenerte a bordo en nuestra plataforma de gesti&oacute;n inteligente de transporte.</p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                            <p style="margin: 0; color: #334155; font-size: 15px;"><strong>Tu correo de acceso:</strong><br/>%s</p>
                        </div>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Ya puedes acceder a todas nuestras funcionalidades y empezar a gestionar el sistema de acuerdo a tus permisos.</p>
                        
                        <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                            <a href="http://localhost:5173/login" style="background-color: #1d4ed8; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Acceder a mi Dashboard</a>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 13px; margin: 0;">&copy; 2026 Smart Buses. Todos los derechos reservados.</p>
                        <p style="color: #9ca3af; font-size: 13px; margin: 5px 0 0 0;">Este es un mensaje autom&aacute;tico, por favor no respondas a este correo.</p>
                    </div>
                </div>
            </div>
            """;
            
        String body = String.format(htmlTemplate, user.getName(), user.getEmail());
        
        sendEmail(user.getEmail(), subject, body);
    }

    /**
     * Envía una alerta de seguridad por cambio de roles o permisos.
     * @param user El usuario afectado.
     * @param roleName El nombre del rol afectado.
     * @param action La acción realizada (Asignación/Eliminación).
     */
    public void sendSecurityAlert(User user, String roleName, String action) {
        String subject = "Alerta de Seguridad: Cambio en tus privilegios";
        
        String htmlTemplate = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #ef4444; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Alerta de Seguridad</h1>
                    </div>
                    <div style="padding: 40px 40px;">
                        <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Hola, %s.</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Nuestro sistema ha detectado un cambio reciente en tus privilegios y roles de acceso en la plataforma <strong>Smart Buses</strong>.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 30px 0;">
                            <tr>
                                <td style="padding: 15px; background-color: #f8fafc; border: 1px solid #e5e7eb; font-weight: bold; color: #475569; width: 35%%;">Tipo de Acci&oacute;n:</td>
                                <td style="padding: 15px; background-color: #ffffff; border: 1px solid #e5e7eb; color: #ef4444; font-weight: bold;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 15px; background-color: #f8fafc; border: 1px solid #e5e7eb; font-weight: bold; color: #475569;">Rol Afectado:</td>
                                <td style="padding: 15px; background-color: #ffffff; border: 1px solid #e5e7eb; color: #1f2937;">%s</td>
                            </tr>
                        </table>
            
                        <p style="color: #64748b; font-size: 15px; line-height: 1.6;">Si t&uacute; o tu administrador autorizaron este cambio, puedes ignorar este mensaje de forma segura.</p>
                        <p style="color: #dc2626; font-size: 15px; line-height: 1.6; font-weight: bold; margin-top: 15px;">Si no reconoces esta actividad, por favor contacta al equipo de soporte de inmediato.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 13px; margin: 0;">&copy; 2026 Smart Buses. Sistema de Seguridad Autom&aacute;tico.</p>
                    </div>
                </div>
            </div>
            """;
            
        String body = String.format(htmlTemplate, user.getName(), action, roleName);
        
        sendEmail(user.getEmail(), subject, body);
    }

    /**
     * Envía un código de autenticación de dos factores (2FA).
     * @param user El usuario que intenta acceder.
     * @param code El código de 6 dígitos generado.
     */
    public void sendTwoFactorCode(User user, String code) {
        String subject = "Código de Seguridad (2FA) - Smart Buses";
        
        String htmlTemplate = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #3b82f6; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">Smart Buses</h1>
                        <p style="color: #e0f2fe; margin-top: 10px; font-size: 16px;">Verificaci&oacute;n de Identidad</p>
                    </div>
                    <div style="padding: 40px 40px;">
                        <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Hola, %s</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Has solicitado acceder a tu cuenta. Para continuar, por favor ingresa el siguiente c&oacute;digo de verificaci&oacute;n de 6 d&iacute;gitos:</p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <div style="background-color: #f8fafc; border: 2px dashed #94a3b8; border-radius: 8px; padding: 20px; display: inline-block;">
                                <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">%s</span>
                            </div>
                        </div>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Este c&oacute;digo <strong>expira en 5 minutos</strong> y solo puede ser utilizado una vez.</p>
                        <p style="color: #ef4444; font-size: 14px; margin-top: 30px;"><b>Nota importante:</b> Nunca compartas este c&oacute;digo con nadie. Si no intentaste iniciar sesi&oacute;n, puedes ignorar este mensaje de forma segura.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 13px; margin: 0;">&copy; 2026 Smart Buses. Sistema de Seguridad Autom&aacute;tico.</p>
                    </div>
                </div>
            </div>
            """;
            
        String body = String.format(htmlTemplate, user.getName(), code);
        
        sendEmail(user.getEmail(), subject, body);
    }

    private void sendEmail(String recipient, String subject, String bodyHtml) {
        try {
            String url = notificationsUrl + "/send-email";
            
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("recipient", recipient);
            requestBody.put("subject", subject);
            requestBody.put("body_html", bodyHtml);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            
            restTemplate.postForEntity(url, entity, String.class);
            System.out.println("[NotificationService] Email sent successfully to: " + recipient);
        } catch (Exception e) {
            System.err.println("[NotificationService] Error sending email: " + e.getMessage());
        }
    }
}

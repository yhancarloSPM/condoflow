namespace CondoFlow.Application.Common.Services;

public class LocalizationService : ILocalizationService
{
    private readonly Dictionary<string, string> _messages = new()
    {
        // Auth messages
        ["InvalidCredentials"] = "Credenciales inválidas",
        ["AccountLocked"] = "Cuenta bloqueada",
        ["PendingApproval"] = "Su cuenta está pendiente de aprobación por un administrador",
        ["LoginSuccessful"] = "Inicio de sesión exitoso",
        ["InvalidInputData"] = "Datos de entrada inválidos",
        ["EmailPasswordRequired"] = "Email y contraseña son requeridos",
        ["LoginError"] = "Ocurrió un error durante el inicio de sesión",
        
        // Registration messages
        ["InvalidRole"] = "Rol especificado inválido",
        ["UserExists"] = "El usuario ya existe",
        ["CreateUserFailed"] = "Error al crear usuario",
        ["RegistrationPending"] = "Registro exitoso. Su cuenta está pendiente de aprobación por un administrador. Te notificaremos por email o WhatsApp cuando sea aprobada. Usa tu correo electrónico para iniciar sesión una vez aprobado.",
        ["RegistrationSuccessful"] = "Registro exitoso. Usa tu correo electrónico para iniciar sesión.",
        ["RegistrationError"] = "Error durante el registro",
        
        // Token messages
        ["RefreshTokenRequired"] = "Token de actualización requerido",
        ["InvalidRefreshToken"] = "Token de actualización inválido",
        ["TokenRefreshed"] = "Token actualizado exitosamente",
        ["TokenRefreshError"] = "Ocurrió un error durante la actualización del token",
        
        // User approval messages
        ["UserNotFound"] = "Usuario no encontrado",
        ["UserAlreadyApproved"] = "El usuario ya está aprobado",
        ["UserApproved"] = "Usuario aprobado exitosamente",
        ["ApprovalError"] = "Ocurrió un error durante la aprobación del usuario",
        ["UserRejected"] = "Usuario rechazado exitosamente",
        ["RejectionError"] = "Ocurrió un error durante el rechazo del usuario",
        
        // General messages
        ["PendingUsersRetrieved"] = "Usuarios pendientes obtenidos exitosamente",
        ["FetchPendingUsersError"] = "Ocurrió un error al obtener usuarios pendientes",
        ["InternalServerError"] = "Ocurrió un error interno del servidor",
        
        // Profile messages
        ["ProfileRetrieved"] = "Perfil obtenido exitosamente",
        
        // Authorization messages
        ["Unauthorized"] = "No autorizado",
        ["Forbidden"] = "Acceso denegado",
        ["AccessDenied"] = "No tienes permisos para acceder a este recurso",
        
        // Payment messages
        ["PaymentCreated"] = "Pago registrado exitosamente",
        ["PaymentsRetrieved"] = "Pagos obtenidos exitosamente",
        ["PaymentError"] = "Ocurrió un error al procesar el pago",
        ["InvalidReceiptFile"] = "Archivo de comprobante inválido. Formatos permitidos: JPG, PNG, PDF (máx. 5MB)"
    };

    public string GetMessage(string key)
    {
        return _messages.TryGetValue(key, out var message) ? message : key;
    }

    public List<string> GetMessages(List<string> keys)
    {
        return keys.Select(GetMessage).ToList();
    }
}
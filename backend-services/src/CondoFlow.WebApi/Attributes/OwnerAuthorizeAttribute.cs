using CondoFlow.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace CondoFlow.WebApi.Attributes;

public class OwnerAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        
        // Verificar que el usuario esté autenticado
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Los Admin pueden acceder a todo
        if (user.IsInRole(UserRoles.Admin))
        {
            return;
        }

        // Para Owners, validar que solo accedan a sus propios datos
        if (user.IsInRole(UserRoles.Owner))
        {
            var userOwnerId = user.FindFirst("OwnerId")?.Value;
            
            if (string.IsNullOrEmpty(userOwnerId))
            {
                context.Result = new ForbidResult();
                return;
            }

            // Buscar ownerId en la ruta
            var routeOwnerId = context.RouteData.Values["ownerId"]?.ToString();
            
            if (!string.IsNullOrEmpty(routeOwnerId) && userOwnerId != routeOwnerId)
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}
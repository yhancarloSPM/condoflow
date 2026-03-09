using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using CondoFlow.Domain.Enums;

namespace CondoFlow.WebApi.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task JoinAdminGroup()
    {
        if (Context.User?.IsInRole(UserRoles.Admin) == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
        }
    }

    public override async Task OnConnectedAsync()
    {
        if (Context.User?.IsInRole(UserRoles.Admin) == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
        }
        else if (Context.User?.Identity?.Name != null)
        {
            var userId = Context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var altUserId = Context.User.FindFirst("sub")?.Value ?? Context.User.FindFirst("id")?.Value;
            
            var finalUserId = userId ?? altUserId;
            if (finalUserId != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{finalUserId}");
            }
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using CondoFlow.Infrastructure.Identity;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OwnersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public OwnersController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("{ownerId}")]
    public async Task<IActionResult> GetOwner(string ownerId)
    {
        try
        {

            
            // Buscar por Id primero
            var user = await _userManager.FindByIdAsync(ownerId);

            
            // Si no se encuentra, buscar por email (en caso de que ownerId sea email)
            if (user == null)
            {

                user = await _userManager.FindByEmailAsync(ownerId);

            }
            
            if (user == null)
            {

                return NotFound(ApiResponse.ErrorResult("Propietario no encontrado", 404));
            }


            
            var ownerData = new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                apartment = user.Apartment,
                block = user.Block
            };

            return Ok(ApiResponse<object>.SuccessResult(ownerData, "Información del propietario obtenida exitosamente", 200));
        }
        catch (Exception ex)
        {

            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener información del propietario: {ex.Message}", 500));
        }
    }
}

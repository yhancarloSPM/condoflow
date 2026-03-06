using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApartmentsController : ControllerBase
{
    private readonly IApartmentRepository _apartmentRepository;

    public ApartmentsController(IApartmentRepository apartmentRepository)
    {
        _apartmentRepository = apartmentRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetApartments()
    {
        try
        {
            var apartments = await _apartmentRepository.GetAllApartmentsAsync();
            return Ok(ApiResponse<object>.SuccessResult(apartments, "Apartamentos obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener los apartamentos", 500));
        }
    }

    [HttpGet("by-block/{blockId}")]
    public async Task<IActionResult> GetApartmentsByBlock(int blockId)
    {
        try
        {
            var apartments = await _apartmentRepository.GetApartmentsByBlockAsync(blockId);
            return Ok(ApiResponse<object>.SuccessResult(apartments, "Apartamentos obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener los apartamentos", 500));
        }
    }

    [HttpGet("{apartmentId}")]
    public async Task<IActionResult> GetApartmentById(int apartmentId)
    {
        try
        {
            var apartment = await _apartmentRepository.GetApartmentByIdAsync(apartmentId);

            if (apartment == null)
            {
                return NotFound(ApiResponse.ErrorResult("Apartamento no encontrado", 404));
            }

            var apartmentInfo = new
            {
                apartment.Id,
                apartment.Number,
                apartment.Floor,
                BlockName = apartment.Block.Name,
                apartment.BlockId,
                apartment.MonthlyMaintenanceAmount,
                FullName = $"{apartment.Block.Name}-{apartment.Number}"
            };

            return Ok(ApiResponse<object>.SuccessResult(apartmentInfo, "Apartamento obtenido exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener el apartamento: {ex.Message}", 500));
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApartmentsController : BaseApiController
{
    private readonly IApartmentRepository _apartmentRepository;

    public ApartmentsController(IApartmentRepository apartmentRepository)
    {
        _apartmentRepository = apartmentRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetApartments()
    {
        var apartments = await _apartmentRepository.GetAllApartmentsAsync();
        return Success(apartments, "Apartamentos obtenidos exitosamente");
    }

    [HttpGet("by-block/{blockId}")]
    public async Task<IActionResult> GetApartmentsByBlock(int blockId)
    {
        var apartments = await _apartmentRepository.GetApartmentsByBlockAsync(blockId);
        return Success(apartments, "Apartamentos obtenidos exitosamente");
    }

    [HttpGet("{apartmentId}")]
    public async Task<IActionResult> GetApartmentById(int apartmentId)
    {
        var apartment = await _apartmentRepository.GetApartmentByIdAsync(apartmentId);

        if (apartment == null)
            return NotFoundError("Apartamento no encontrado");

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

        return Success(apartmentInfo, "Apartamento obtenido exitosamente");
    }
}

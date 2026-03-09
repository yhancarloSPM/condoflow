using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PollsController : BaseApiController
{
    private readonly IPollService _pollService;

    public PollsController(IPollService pollService)
    {
        _pollService = pollService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPolls()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        var polls = await _pollService.GetAllPollsAsync(userId);
        return Success(polls, "Encuestas obtenidas exitosamente");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPoll(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        var poll = await _pollService.GetPollByIdAsync(id, userId);
        if (poll == null)
            return NotFoundError<PollDto>("Encuesta no encontrada");

        return Success(poll, "Encuesta obtenida exitosamente");
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreatePoll([FromBody] CreatePollDto createDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        if (createDto.Options.Count < 2)
            return BadRequestError("La encuesta debe tener al menos 2 opciones");

        if (createDto.EndDate <= createDto.StartDate)
            return BadRequestError("La fecha de fin debe ser posterior a la fecha de inicio");

        var poll = await _pollService.CreatePollAsync(createDto, userId);
        return Created(poll, "Encuesta creada exitosamente");
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePoll(int id, [FromBody] CreatePollDto updateDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        if (updateDto.Options.Count < 2)
            return BadRequestError("La encuesta debe tener al menos 2 opciones");

        if (updateDto.EndDate <= updateDto.StartDate)
            return BadRequestError("La fecha de fin debe ser posterior a la fecha de inicio");

        try
        {
            var poll = await _pollService.UpdatePollAsync(id, updateDto, userId);
            return Success(poll, "Encuesta actualizada exitosamente");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestError(ex.Message);
        }
    }

    [HttpPost("{id}/vote")]
    public async Task<IActionResult> Vote(int id, [FromBody] VoteDto voteDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        voteDto.PollId = id;
        var success = await _pollService.VoteAsync(voteDto, userId);
        
        if (!success)
            return BadRequestError("No se pudo registrar el voto. Verifique que la encuesta esté activa y la opción sea válida.");

        return Success<object>(null!, "Voto registrado exitosamente");
    }

    [HttpPost("{id}/vote-multiple")]
    public async Task<IActionResult> VoteMultiple(int id, [FromBody] MultipleVoteDto voteDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        if (voteDto.OptionIds == null || !voteDto.OptionIds.Any())
            return BadRequestError("Debe seleccionar al menos una opción");

        voteDto.PollId = id;
        var success = await _pollService.VoteMultipleAsync(voteDto, userId);
        
        if (!success)
            return BadRequestError("No se pudo registrar el voto. Verifique que la encuesta esté activa y las opciones sean válidas.");

        return Success<object>(null!, "Votos registrados exitosamente");
    }

    [HttpPost("{id}/vote-custom")]
    public async Task<IActionResult> VoteCustom(int id, [FromBody] CustomVoteDto voteDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        if (string.IsNullOrWhiteSpace(voteDto.CustomText))
            return BadRequestError("Debe proporcionar un texto personalizado");

        voteDto.PollId = id;
        var success = await _pollService.VoteCustomAsync(voteDto, userId);
        
        if (!success)
            return BadRequestError("No se pudo registrar el voto. Verifique que la encuesta permita opciones personalizadas.");

        return Success<object>(null!, "Voto personalizado registrado exitosamente");
    }

    [HttpPost("{id}/vote-custom-multiple")]
    public async Task<IActionResult> VoteCustomMultiple(int id, [FromBody] CustomMultipleVoteDto voteDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        if ((voteDto.OptionIds == null || !voteDto.OptionIds.Any()) && string.IsNullOrWhiteSpace(voteDto.CustomText))
            return BadRequestError("Debe seleccionar al menos una opción o proporcionar texto personalizado");

        voteDto.PollId = id;
        var success = await _pollService.VoteCustomMultipleAsync(voteDto, userId);
        
        if (!success)
            return BadRequestError("No se pudo registrar el voto. Verifique que la encuesta esté activa y permita opciones personalizadas.");

        return Success<object>(null!, "Votos registrados exitosamente");
    }

    [HttpPut("{id}/close")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ClosePoll(int id)
    {
        var success = await _pollService.ClosePollAsync(id);
        if (!success)
            return NotFoundError("Encuesta no encontrada");

        return Success<object>(null!, "Encuesta cerrada exitosamente");
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePoll(int id)
    {
        var success = await _pollService.DeletePollAsync(id);
        if (!success)
            return NotFoundError("Encuesta no encontrada");

        return Success<object>(null!, "Encuesta eliminada exitosamente");
    }
}
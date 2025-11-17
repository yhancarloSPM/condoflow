using CondoFlow.Application.DTOs;
using CondoFlow.Infrastructure.Services;
using CondoFlow.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PollsController : ControllerBase
{
    private readonly IPollService _pollService;

    public PollsController(IPollService pollService)
    {
        _pollService = pollService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<PollDto>>>> GetPolls()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<IEnumerable<PollDto>>
                {
                    Success = false,
                    Message = "Usuario no autenticado"
                });
            }

            var polls = await _pollService.GetAllPollsAsync(userId);
            return Ok(new ApiResponse<IEnumerable<PollDto>>
            {
                Success = true,
                Data = polls,
                Message = "Encuestas obtenidas exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<IEnumerable<PollDto>>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PollDto>>> GetPoll(int id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "Usuario no autenticado"
                });
            }

            var poll = await _pollService.GetPollByIdAsync(id, userId);
            if (poll == null)
            {
                return NotFound(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "Encuesta no encontrada"
                });
            }

            return Ok(new ApiResponse<PollDto>
            {
                Success = true,
                Data = poll,
                Message = "Encuesta obtenida exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<PollDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PollDto>>> CreatePoll([FromBody] CreatePollDto createDto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "Usuario no autenticado"
                });
            }

            if (createDto.Options.Count < 2)
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "La encuesta debe tener al menos 2 opciones"
                });
            }

            if (createDto.EndDate <= createDto.StartDate)
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "La fecha de fin debe ser posterior a la fecha de inicio"
                });
            }

            var poll = await _pollService.CreatePollAsync(createDto, userId);
            return CreatedAtAction(nameof(GetPoll), new { id = poll.Id }, new ApiResponse<PollDto>
            {
                Success = true,
                Data = poll,
                Message = "Encuesta creada exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<PollDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpPost("{id}/vote")]
    public async Task<ActionResult<ApiResponse<object>>> Vote(int id, [FromBody] VoteDto voteDto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Usuario no autenticado"
                });
            }

            voteDto.PollId = id; // Asegurar que el ID coincida
            var success = await _pollService.VoteAsync(voteDto, userId);
            
            if (!success)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No se pudo registrar el voto. Verifique que la encuesta esté activa y la opción sea válida."
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Voto registrado exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpPut("{id}/close")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> ClosePoll(int id)
    {
        try
        {
            var success = await _pollService.ClosePollAsync(id);
            if (!success)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Encuesta no encontrada"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Encuesta cerrada exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeletePoll(int id)
    {
        try
        {
            var success = await _pollService.DeletePollAsync(id);
            if (!success)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Encuesta no encontrada"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Encuesta eliminada exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }
}
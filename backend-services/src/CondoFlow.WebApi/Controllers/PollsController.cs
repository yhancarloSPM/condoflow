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

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PollDto>>> UpdatePoll(int id, [FromBody] CreatePollDto updateDto)
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

            if (updateDto.Options.Count < 2)
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "La encuesta debe tener al menos 2 opciones"
                });
            }

            if (updateDto.EndDate <= updateDto.StartDate)
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "La fecha de fin debe ser posterior a la fecha de inicio"
                });
            }

            var poll = await _pollService.UpdatePollAsync(id, updateDto, userId);
            return Ok(new ApiResponse<PollDto>
            {
                Success = true,
                Data = poll,
                Message = "Encuesta actualizada exitosamente"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse<PollDto>
            {
                Success = false,
                Message = ex.Message
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

    [HttpPost("{id}/vote-multiple")]
    public async Task<ActionResult<ApiResponse<object>>> VoteMultiple(int id, [FromBody] MultipleVoteDto voteDto)
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

            if (voteDto.OptionIds == null || !voteDto.OptionIds.Any())
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Debe seleccionar al menos una opción"
                });
            }

            voteDto.PollId = id; // Asegurar que el ID coincida
            var success = await _pollService.VoteMultipleAsync(voteDto, userId);
            
            if (!success)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No se pudo registrar el voto. Verifique que la encuesta esté activa y las opciones sean válidas."
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Votos registrados exitosamente"
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

    [HttpPost("{id}/vote-custom")]
    public async Task<ActionResult<ApiResponse<object>>> VoteCustom(int id, [FromBody] CustomVoteDto voteDto)
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

            if (string.IsNullOrWhiteSpace(voteDto.CustomText))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Debe proporcionar un texto personalizado"
                });
            }

            voteDto.PollId = id;
            var success = await _pollService.VoteCustomAsync(voteDto, userId);
            
            if (!success)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No se pudo registrar el voto. Verifique que la encuesta permita opciones personalizadas."
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Voto personalizado registrado exitosamente"
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

    [HttpPost("{id}/vote-custom-multiple")]
    public async Task<ActionResult<ApiResponse<object>>> VoteCustomMultiple(int id, [FromBody] CustomMultipleVoteDto voteDto)
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

            if ((voteDto.OptionIds == null || !voteDto.OptionIds.Any()) && string.IsNullOrWhiteSpace(voteDto.CustomText))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Debe seleccionar al menos una opción o proporcionar texto personalizado"
                });
            }

            voteDto.PollId = id;
            var success = await _pollService.VoteCustomMultipleAsync(voteDto, userId);
            
            if (!success)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No se pudo registrar el voto. Verifique que la encuesta esté activa y permita opciones personalizadas."
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Votos registrados exitosamente"
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
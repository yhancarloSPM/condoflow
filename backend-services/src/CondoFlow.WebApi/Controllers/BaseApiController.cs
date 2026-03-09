using CondoFlow.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

/// <summary>
/// Base controller que proporciona métodos helper para respuestas API estandarizadas.
/// Todos los controllers deben heredar de esta clase para mantener consistencia.
/// </summary>
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Retorna una respuesta exitosa con datos.
    /// </summary>
    protected IActionResult Success<T>(T data, string message = "Operation completed successfully", int statusCode = 200)
    {
        return StatusCode(statusCode, ApiResponse<T>.SuccessResult(data, message, statusCode));
    }

    /// <summary>
    /// Retorna una respuesta exitosa sin datos.
    /// </summary>
    protected IActionResult Success(string message = "Operation completed successfully", int statusCode = 200)
    {
        return StatusCode(statusCode, ApiResponse.SuccessResult(message, statusCode));
    }

    /// <summary>
    /// Retorna una respuesta de error.
    /// </summary>
    protected IActionResult Error(string message, int statusCode = 400, List<string>? errors = null)
    {
        return StatusCode(statusCode, ApiResponse.ErrorResult(message, statusCode, errors));
    }

    /// <summary>
    /// Retorna una respuesta de error con tipo genérico.
    /// </summary>
    protected IActionResult Error<T>(string message, int statusCode = 400, List<string>? errors = null)
    {
        return StatusCode(statusCode, ApiResponse<T>.ErrorResult(message, statusCode, errors));
    }

    /// <summary>
    /// Retorna una respuesta 404 Not Found.
    /// </summary>
    protected IActionResult NotFoundError(string message = "Resource not found")
    {
        return NotFound(ApiResponse.ErrorResult(message, 404));
    }

    /// <summary>
    /// Retorna una respuesta 404 Not Found con tipo genérico.
    /// </summary>
    protected IActionResult NotFoundError<T>(string message = "Resource not found")
    {
        return NotFound(ApiResponse<T>.ErrorResult(message, 404));
    }

    /// <summary>
    /// Retorna una respuesta 401 Unauthorized.
    /// </summary>
    protected IActionResult UnauthorizedError(string message = "Unauthorized access")
    {
        return Unauthorized(ApiResponse.ErrorResult(message, 401));
    }

    /// <summary>
    /// Retorna una respuesta 403 Forbidden.
    /// </summary>
    protected IActionResult ForbiddenError(string message = "Access forbidden")
    {
        return StatusCode(403, ApiResponse.ErrorResult(message, 403));
    }

    /// <summary>
    /// Retorna una respuesta 400 Bad Request.
    /// </summary>
    protected IActionResult BadRequestError(string message = "Invalid request", List<string>? errors = null)
    {
        return BadRequest(ApiResponse.ErrorResult(message, 400, errors));
    }

    /// <summary>
    /// Retorna una respuesta 201 Created con datos.
    /// </summary>
    protected IActionResult Created<T>(T data, string message = "Resource created successfully")
    {
        return StatusCode(201, ApiResponse<T>.SuccessResult(data, message, 201));
    }

    /// <summary>
    /// Retorna una respuesta 204 No Content.
    /// </summary>
    protected IActionResult NoContentSuccess()
    {
        return NoContent();
    }
}

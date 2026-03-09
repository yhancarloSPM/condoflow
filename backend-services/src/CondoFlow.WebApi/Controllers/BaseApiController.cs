using CondoFlow.Application.Common.Models;
using CondoFlow.Domain.Enums;
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
    protected IActionResult Success<T>(T data, string message = "Operation completed successfully", int statusCode = HttpStatusCodes.Ok)
    {
        return StatusCode(statusCode, ApiResponse<T>.SuccessResult(data, message, statusCode));
    }

    /// <summary>
    /// Retorna una respuesta exitosa sin datos.
    /// </summary>
    protected IActionResult Success(string message = "Operation completed successfully", int statusCode = HttpStatusCodes.Ok)
    {
        return StatusCode(statusCode, ApiResponse<object>.SuccessResult(message, statusCode));
    }

    /// <summary>
    /// Retorna una respuesta de error.
    /// </summary>
    protected IActionResult Error(string message, int statusCode = HttpStatusCodes.BadRequest, List<string>? errors = null)
    {
        return StatusCode(statusCode, ApiResponse<object>.ErrorResult(message, statusCode, errors));
    }

    /// <summary>
    /// Retorna una respuesta de error con tipo genérico.
    /// </summary>
    protected IActionResult Error<T>(string message, int statusCode = HttpStatusCodes.BadRequest, List<string>? errors = null)
    {
        return StatusCode(statusCode, ApiResponse<T>.ErrorResult(message, statusCode, errors));
    }

    /// <summary>
    /// Retorna una respuesta 404 Not Found.
    /// </summary>
    protected IActionResult NotFoundError(string message = "Resource not found")
    {
        return NotFound(ApiResponse<object>.ErrorResult(message, HttpStatusCodes.NotFound));
    }

    /// <summary>
    /// Retorna una respuesta 404 Not Found con tipo genérico.
    /// </summary>
    protected IActionResult NotFoundError<T>(string message = "Resource not found")
    {
        return NotFound(ApiResponse<T>.ErrorResult(message, HttpStatusCodes.NotFound));
    }

    /// <summary>
    /// Retorna una respuesta 401 Unauthorized.
    /// </summary>
    protected IActionResult UnauthorizedError(string message = "Unauthorized access")
    {
        return Unauthorized(ApiResponse<object>.ErrorResult(message, HttpStatusCodes.Unauthorized));
    }

    /// <summary>
    /// Retorna una respuesta 403 Forbidden.
    /// </summary>
    protected IActionResult ForbiddenError(string message = "Access forbidden")
    {
        return StatusCode(HttpStatusCodes.Forbidden, ApiResponse<object>.ErrorResult(message, HttpStatusCodes.Forbidden));
    }

    /// <summary>
    /// Retorna una respuesta 400 Bad Request.
    /// </summary>
    protected IActionResult BadRequestError(string message = "Invalid request", List<string>? errors = null)
    {
        return BadRequest(ApiResponse<object>.ErrorResult(message, HttpStatusCodes.BadRequest, errors));
    }

    /// <summary>
    /// Retorna una respuesta 201 Created con datos.
    /// </summary>
    protected IActionResult Created<T>(T data, string message = "Resource created successfully")
    {
        return StatusCode(HttpStatusCodes.Created, ApiResponse<T>.SuccessResult(data, message, HttpStatusCodes.Created));
    }

    /// <summary>
    /// Retorna una respuesta 204 No Content.
    /// </summary>
    protected IActionResult NoContentSuccess()
    {
        return NoContent();
    }

    /// <summary>
    /// Retorna una respuesta 500 Internal Server Error.
    /// </summary>
    protected IActionResult InternalServerError(string message = "Internal server error")
    {
        return StatusCode(HttpStatusCodes.InternalServerError, ApiResponse<object>.ErrorResult(message, HttpStatusCodes.InternalServerError));
    }

    /// <summary>
    /// Retorna una respuesta 500 Internal Server Error con tipo genérico.
    /// </summary>
    protected IActionResult InternalServerError<T>(string message = "Internal server error")
    {
        return StatusCode(HttpStatusCodes.InternalServerError, ApiResponse<T>.ErrorResult(message, HttpStatusCodes.InternalServerError));
    }
}

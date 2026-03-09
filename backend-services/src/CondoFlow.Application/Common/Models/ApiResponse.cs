using CondoFlow.Domain.Enums;

namespace CondoFlow.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ApiResponse<T> SuccessResult(T data, string message = "Operation completed successfully", int statusCode = HttpStatusCodes.Ok)
        => new() { Success = true, Message = message, Data = data, StatusCode = statusCode };

    public static ApiResponse<T> SuccessResult(string message, int statusCode = HttpStatusCodes.Ok)
        => new() { Success = true, Message = message, StatusCode = statusCode };

    public static ApiResponse<T> ErrorResult(string message, int statusCode = HttpStatusCodes.BadRequest, List<string>? errors = null)
        => new() { Success = false, Message = message, StatusCode = statusCode, Errors = errors ?? new() };
}
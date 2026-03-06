namespace CondoFlow.WebApi.Services;

public interface IFileService
{
    Task<string> ConvertToBase64Async(IFormFile file);
    string ConvertToBase64(string fileName, string fileType, string base64Content);
    bool IsValidReceiptFile(IFormFile file);
    bool IsValidReceiptFile(string fileName, string fileType, string base64Content);
}
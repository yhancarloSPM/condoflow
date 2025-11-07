namespace CondoFlow.WebApi.Services;

public interface IFileService
{
    Task<string> SaveReceiptAsync(IFormFile file, Guid ownerId, Guid paymentId);
    Task<string> SaveReceiptFromBase64Async(string fileName, string fileType, string base64Content, Guid ownerId, Guid paymentId);
    bool IsValidReceiptFile(IFormFile file);
    bool IsValidReceiptFile(string fileName, string fileType, string base64Content);
}
namespace CondoFlow.WebApi.Services;

public class FileService : IFileService
{
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public async Task<string> ConvertToBase64Async(IFormFile file)
    {
        if (!IsValidReceiptFile(file))
            throw new ArgumentException("Invalid file format or size");

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var fileBytes = memoryStream.ToArray();
        var base64String = Convert.ToBase64String(fileBytes);
        
        var contentType = GetContentType(file.FileName);
        return $"data:{contentType};base64,{base64String}";
    }

    public string ConvertToBase64(string fileName, string fileType, string base64Content)
    {
        if (!IsValidReceiptFile(fileName, fileType, base64Content))
            throw new ArgumentException("Invalid file format or size");

        var contentType = GetContentType(fileName);
        return $"data:{contentType};base64,{base64Content}";
    }

    public bool IsValidReceiptFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return false;

        if (file.Length > MaxFileSize)
            return false;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        return _allowedExtensions.Contains(extension);
    }

    public bool IsValidReceiptFile(string fileName, string fileType, string base64Content)
    {
        if (string.IsNullOrEmpty(fileName) || string.IsNullOrEmpty(base64Content))
            return false;

        try
        {
            var fileBytes = Convert.FromBase64String(base64Content);
            if (fileBytes.Length > MaxFileSize)
                return false;

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return _allowedExtensions.Contains(extension);
        }
        catch
        {
            return false;
        }
    }

    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => "application/octet-stream"
        };
    }
}
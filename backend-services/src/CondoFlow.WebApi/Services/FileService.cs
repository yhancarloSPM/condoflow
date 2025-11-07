namespace CondoFlow.WebApi.Services;

public class FileService : IFileService
{
    private readonly IWebHostEnvironment _environment;
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public FileService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveReceiptAsync(IFormFile file, Guid ownerId, Guid paymentId)
    {
        if (!IsValidReceiptFile(file))
            throw new ArgumentException("Invalid file format or size");

        var webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRootPath, "receipts", ownerId.ToString());
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{paymentId}_{DateTime.UtcNow:yyyyMMddHHmmss}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/receipts/{ownerId}/{fileName}";
    }

    public async Task<string> SaveReceiptFromBase64Async(string fileName, string fileType, string base64Content, Guid ownerId, Guid paymentId)
    {
        if (!IsValidReceiptFile(fileName, fileType, base64Content))
            throw new ArgumentException("Invalid file format or size");

        var webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRootPath, "receipts", ownerId.ToString());
        Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var newFileName = $"{paymentId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
        var filePath = Path.Combine(uploadsFolder, newFileName);

        var fileBytes = Convert.FromBase64String(base64Content);
        await File.WriteAllBytesAsync(filePath, fileBytes);

        return $"/receipts/{ownerId}/{newFileName}";
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
}
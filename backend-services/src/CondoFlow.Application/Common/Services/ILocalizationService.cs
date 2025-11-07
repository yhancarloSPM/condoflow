namespace CondoFlow.Application.Common.Services;

public interface ILocalizationService
{
    string GetMessage(string key);
    List<string> GetMessages(List<string> keys);
}
using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class Owner : BaseEntity
{
    public string FirstName { get; private set; } = null!;
    public string LastName { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string Phone { get; private set; } = null!;
    public string DocumentId { get; private set; } = null!;

    private readonly List<Apartment> _apartments = new();
    public IReadOnlyList<Apartment> Apartments => _apartments.AsReadOnly();

    private Owner() { }

    public Owner(string firstName, string lastName, string email, string phone, string documentId)
    {
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        Email = email ?? throw new ArgumentNullException(nameof(email));
        Phone = phone ?? throw new ArgumentNullException(nameof(phone));
        DocumentId = documentId ?? throw new ArgumentNullException(nameof(documentId));
    }

    public void AddApartment(Apartment apartment)
    {
        if (!_apartments.Contains(apartment))
        {
            _apartments.Add(apartment);
            SetUpdatedAt();
        }
    }
}
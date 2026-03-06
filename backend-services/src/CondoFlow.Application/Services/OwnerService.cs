using AutoMapper;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;

namespace CondoFlow.Application.Services;

public class OwnerService : IOwnerService
{
    private readonly IIdentityService _identityService;
    private readonly IDebtRepository _debtRepository;
    private readonly IApartmentRepository _apartmentRepository;
    private readonly IMapper _mapper;

    public OwnerService(
        IIdentityService identityService, 
        IDebtRepository debtRepository,
        IApartmentRepository apartmentRepository,
        IMapper mapper)
    {
        _identityService = identityService;
        _debtRepository = debtRepository;
        _apartmentRepository = apartmentRepository;
        _mapper = mapper;
    }

    public async Task<OwnerDto?> GetOwnerByIdAsync(string ownerId)
    {
        // Buscar por Id primero
        var user = await _identityService.FindUserByIdAsync(ownerId);
        
        // Si no se encuentra, buscar por email
        if (user == null)
        {
            user = await _identityService.FindUserByEmailAsync(ownerId);
        }
        
        if (user == null)
            return null;
        
        // Mapear usando AutoMapper para objetos dinámicos
        return _mapper.Map<OwnerDto>(user);
    }

    public async Task<List<OwnerSummaryDto>> GetOwnersSummaryAsync()
    {
        var activeDebts = await _debtRepository.GetActiveDebtsAsync();
        
        if (!activeDebts.Any())
        {
            return new List<OwnerSummaryDto>();
        }

        var ownerIds = activeDebts.Select(d => d.OwnerId).Distinct().ToList();
        var allUsers = await _identityService.GetAllUsersAsync();
        var usersArray = allUsers as object[] ?? allUsers.ToArray();
        
        var ownersSummary = new List<OwnerSummaryDto>();

        foreach (var ownerId in ownerIds)
        {
            dynamic? user = usersArray.FirstOrDefault(u => 
            {
                dynamic userData = u;
                return userData.OwnerId == ownerId;
            });

            if (user == null) continue;

            var ownerDebts = activeDebts.Where(d => d.OwnerId == ownerId).ToList();
            
            var apartmentInfo = "";
            if (user.ApartmentId != null)
            {
                var apartment = await _apartmentRepository.GetApartmentWithBlockAsync((int)user.ApartmentId);
                if (apartment != null)
                {
                    dynamic aptData = apartment;
                    apartmentInfo = $"{aptData.BlockName}-{aptData.Number}";
                }
            }

            ownersSummary.Add(new OwnerSummaryDto
            {
                OwnerId = ownerId,
                Name = $"{user.FirstName} {user.LastName}",
                Apartment = apartmentInfo,
                PendingAmount = ownerDebts.Where(d => d.Status == StatusPayments.Pending).Sum(d => d.Amount.Amount),
                OverdueAmount = ownerDebts.Where(d => d.Status == StatusPayments.Overdue || d.Status == StatusPayments.PaymentSubmitted).Sum(d => d.Amount.Amount),
                TotalAmount = ownerDebts.Sum(d => d.Amount.Amount),
                PendingCount = ownerDebts.Count(d => d.Status == StatusPayments.Pending),
                OverdueCount = ownerDebts.Count(d => d.Status == StatusPayments.Overdue || d.Status == StatusPayments.PaymentSubmitted),
                LastUpdate = ownerDebts.Max(d => d.CreatedAt)
            });
        }

        return ownersSummary.OrderByDescending(o => o.TotalAmount).ToList();
    }

    public async Task<List<OwnerDebtDetailDto>> GetOwnerDebtsDetailAsync(Guid ownerId)
    {
        var debts = await _debtRepository.GetDebtsByOwnerIdAsync(ownerId);
        
        var activeDebts = debts
            .Where(d => d.Status == StatusPayments.Pending || d.Status == StatusPayments.Overdue || d.Status == StatusPayments.PaymentSubmitted)
            .OrderByDescending(d => d.Year)
            .ThenByDescending(d => d.Month)
            .ToList();

        // Mapear usando AutoMapper y ajustar el Status si es necesario
        var debtDetails = _mapper.Map<List<OwnerDebtDetailDto>>(activeDebts);
        
        // Ajustar el Status para deudas vencidas
        foreach (var detail in debtDetails)
        {
            var debt = activeDebts.First(d => d.Id == detail.Id);
            if (debt.IsOverdue)
            {
                detail.Status = StatusPayments.Overdue.ToString();
            }
        }
        
        return debtDetails;
    }
}

using AutoMapper;
using CondoFlow.Application.Common.DTOs.Debt;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Configuration;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;
using CondoFlow.Domain.Helpers;
using CondoFlow.Domain.ValueObjects;
using Microsoft.Extensions.Options;

namespace CondoFlow.Application.Services;

public class DebtService : IDebtService
{
    private readonly IDebtRepository _debtRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPaymentConceptRepository _paymentConceptRepository;
    private readonly IApartmentRepository _apartmentRepository;
    private readonly IMapper _mapper;
    private readonly DebtConfiguration _debtConfig;

    public DebtService(
        IDebtRepository debtRepository,
        IUserRepository userRepository,
        IPaymentConceptRepository paymentConceptRepository,
        IApartmentRepository apartmentRepository,
        IMapper mapper,
        IOptions<DebtConfiguration> debtConfig)
    {
        _debtRepository = debtRepository;
        _userRepository = userRepository;
        _paymentConceptRepository = paymentConceptRepository;
        _apartmentRepository = apartmentRepository;
        _mapper = mapper;
        _debtConfig = debtConfig.Value;
    }

    public async Task<DebtSummaryDto> GetOwnerDebtsAsync(Guid ownerId)
    {
        var debts = await _debtRepository.GetByOwnerIdAsync(ownerId);
        var debtDtos = _mapper.Map<List<DebtDto>>(debts);

        var currentDebts = debtDtos.Where(d => d.Status == StatusPayments.Pending).ToList();
        var overdueDebts = debtDtos.Where(d => d.Status == StatusPayments.Overdue).ToList();
        var paidDebts = debtDtos.Where(d => d.Status == StatusPayments.Paid).ToList();
        var paymentSubmittedDebts = debtDtos.Where(d => d.Status == StatusPayments.PaymentSubmitted).ToList();

        var totalPending = currentDebts.Sum(d => d.RemainingAmount) + overdueDebts.Sum(d => d.RemainingAmount);

        // Crear el resumen con datos calculados
        var summary = new DebtStatisticsDto
        {
            TotalCurrent = currentDebts.Count,
            TotalOverdue = overdueDebts.Count,
            TotalPaymentSubmitted = paymentSubmittedDebts.Count,
            TotalPaid = paidDebts.Count
        };

        return new DebtSummaryDto
        {
            CurrentDebts = currentDebts,
            OverdueDebts = overdueDebts,
            PaymentSubmittedDebts = paymentSubmittedDebts,
            PaidDebts = paidDebts,
            TotalPending = totalPending,
            Summary = summary
        };
    }

    public async Task<IEnumerable<DebtDto>> GetAllDebtsAsync()
    {
        var debts = await _debtRepository.GetAllAsync();
        var users = await _userRepository.GetUsersWithApartmentsAsync();
        var usersArray = users as object[] ?? users.ToArray();

        var debtDtos = _mapper.Map<List<DebtDto>>(debts);

        // Enriquecer con información del usuario
        foreach (var dto in debtDtos)
        {
            dynamic? user = usersArray.FirstOrDefault(u =>
            {
                dynamic userData = u;
                return userData.OwnerId == dto.OwnerId;
            });

            dto.OwnerName = user != null ? $"{user.FirstName} {user.LastName}" : "Usuario no encontrado";
            dto.Apartment = user?.Apartment ?? "";
        }

        return debtDtos;
    }

    public async Task<Guid> CreateDebtAsync(CreateDebtRequest dto, Guid ownerId)
    {
        var maintenanceConcept = await _paymentConceptRepository.GetByCodeAsync(PaymentConceptCodes.Maintenance);
        
        if (maintenanceConcept == null)
            throw new InvalidOperationException("Concepto de mantenimiento no encontrado");
        
        var user = await _userRepository.GetUserWithApartmentAsync(ownerId.ToString());
        if (user == null)
            throw new InvalidOperationException("Owner no encontrado");

        if (user.ApartmentId == null)
            throw new InvalidOperationException("Owner no tiene apartamento asignado");
        
        var apartment = await _apartmentRepository.GetByIdAsync(user.ApartmentId.Value);
        if (apartment == null)
            throw new InvalidOperationException("Apartamento no encontrado");

        var isRoofApartment = _debtConfig.RoofApartmentNumbers.Contains(apartment.Number);
        var amount = isRoofApartment ? maintenanceConcept.RoofAmount!.Value : maintenanceConcept.DefaultAmount!.Value;
        var dueDate = new DateTime(dto.Year, dto.Month, DateTime.DaysInMonth(dto.Year, dto.Month));
        
        // Usar el constructor de Debt que encapsula la lógica de dominio
        var debt = new Debt(
            ownerId,
            new Money(amount, "DOP"),
            dueDate,
            dto.Concept,
            dto.Month,
            dto.Year
        );

        await _debtRepository.AddAsync(debt);
        return debt.Id;
    }

    public async Task<DebtGenerationResultDto> GenerateYearDebtsAsync(int year)
    {
        var users = await _userRepository.GetUsersWithApartmentsAsync();
        var usersArray = users as object[] ?? users.ToArray();
        
        var approvedUsers = usersArray.Where(u =>
        {
            dynamic userData = u;
            return userData.OwnerId != null && userData.IsApproved && userData.ApartmentId != null;
        }).ToList();

        var debtsCreated = 0;

        for (int month = 1; month <= 12; month++)
        {
            foreach (dynamic user in approvedUsers)
            {
                Guid ownerId = (Guid)user.OwnerId;
                var allDebts = (await _debtRepository.GetByOwnerIdAsync(ownerId)).ToList();
                int currentMonth = month;
                var existingDebt = allDebts.FirstOrDefault(d => d.Month == currentMonth && d.Year == year);

                if (existingDebt == null)
                {
                    var apartment = await _apartmentRepository.GetByIdAsync((int)user.ApartmentId);
                    if (apartment == null) continue;

                    var isRoofApartment = _debtConfig.RoofApartmentNumbers.Contains(apartment.Number);
                    var amount = isRoofApartment ? _debtConfig.RoofApartmentAmount : _debtConfig.DefaultAmount;
                    
                    var debt = new Debt(
                        ownerId,
                        new Money(amount, "DOP"),
                        new DateTime(year, month, DateTime.DaysInMonth(year, month)),
                        $"Mantenimiento {DateHelper.GetMonthName(month)} {year}",
                        month,
                        year
                    );

                    await _debtRepository.AddAsync(debt);
                    debtsCreated++;
                }
            }
        }

        return new DebtGenerationResultDto
        {
            DebtsCreated = debtsCreated,
            TotalUsers = approvedUsers.Count
        };
    }
}
